import fs from 'fs';

import { template } from 'lodash';
import nodemailer from 'nodemailer';
import stubTransport from 'nodemailer-stub-transport';
import { markdown } from 'nodemailer-markdown';
import path from 'path';

/**
 * Extract template variables into an object
 * @param {String} input Markdown to process
 * @return {{params: object, filtered: String}} Object containing params object and filtered input string
 */
function getCommentVariables(input) {
  const regex = /^<!--[\s\S]*?-->/g;
  const comment = input.match(regex)[0];
  const params = {};

  if (comment) {
    comment
      .replace(/<!--(-*)|(-*)-->/g, '')
      .split(/\r?\n/)
      .forEach(line => {
        if (!line) {
          return;
        }

        const [key, value] = line.split('=');
        params[key] = value;
      });
  }

  const filtered = input.replace(regex, '');

  return { params, filtered };
}

function processTemplate(templateName, replacements) {
  const temp = fs.readFileSync(path.join(__dirname, `../templates/${templateName}.md`), 'utf8');
  const { params, filtered } = getCommentVariables(temp);

  const content = template(filtered)({ ...params, ...replacements });
  return { params: { ...params, ...replacements }, content };
}

async function getTransport(smtp) {
  let transport;

  if (smtp) {
    transport = nodemailer.createTransport(smtp);
  } else {
    transport = nodemailer.createTransport(stubTransport());
  }

  transport.use('compile', markdown());
  return transport;
}

export async function sendEmail({ to, from, cc, bcc, subject }, message, smtp) {
  const transport = await getTransport(smtp);
  const result = await transport.sendMail({
    from,
    to,
    subject,
    cc,
    bcc,
    markdown: message,
  });

  if (process.env.NODE_ENV !== 'production' || !smtp) {
    // eslint-disable-next-line no-console
    console.log(`Mail not sent: ${result.response}`);
  }

  transport.close();

  return result;
}

export async function sendWelcomeEmail({ email, name, url }, smtp) {
  const replacements = {
    ...(name && { Name: name }),
    url,
  };

  const { params, content } = processTemplate('welcome', replacements);
  const { subject } = params || 'Welcome to Appsemble';

  const to = name ? `"${name}" <${email}>` : email;
  await sendEmail({ to, from: 'appsemble@d-centralize.nl', subject }, content, smtp);
}

export async function resendVerificationEmail({ email, name, url }, smtp) {
  const replacements = {
    ...(name && { Name: name }),
    url,
  };

  const { params, content } = processTemplate('resend', replacements);
  const { subject } = params || 'Confirm account registration';

  const to = name ? `"${name}" <${email}>` : email;
  await sendEmail({ to, from: 'appsemble@d-centralize.nl', subject }, content, smtp);
}
