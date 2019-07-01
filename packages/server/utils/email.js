import { logger } from '@appsemble/node-utils';
import dedent from 'dedent';
import frontmatter from 'front-matter';
import fs from 'fs';
import { template } from 'lodash';
import nodemailer from 'nodemailer';
import { markdown } from 'nodemailer-markdown';
import path from 'path';

function readTemplate(templateName) {
  return fs.readFileSync(path.join(__dirname, `../templates/email/${templateName}.md`), 'utf8');
}

export function processTemplate(temp, replacements) {
  const { attributes, body } = frontmatter(temp);

  const content = template(body)({ ...attributes, ...replacements });
  return { attributes: { ...attributes, ...replacements }, content };
}

async function getTransport(smtp) {
  let transport;

  if (smtp) {
    transport = nodemailer.createTransport(smtp);
  } else {
    transport = nodemailer.createTransport({ jsonTransport: true });
  }

  transport.use('compile', markdown());
  return transport;
}

export async function sendEmail({ to, cc, bcc, subject }, message, smtp) {
  const transport = await getTransport(smtp);
  const { from } = smtp || '';
  const result = await transport.sendMail({
    from,
    to,
    subject,
    cc,
    bcc,
    markdown: message,
  });

  if (process.env.NODE_ENV !== 'production' || !smtp) {
    if (process.env.NODE_ENV !== 'test') {
      const {
        to: [toObject],
        markdown: content,
      } = JSON.parse(result.message);

      logger.warn(
        dedent(
          `Mail not sent:
        To: ${toObject.name ? `${toObject.name}<${toObject.address}>}` : toObject.address}
        Subject: ${subject}

        ${content}`,
        ),
      );
    }
  }

  transport.close();

  return result;
}

export async function sendWelcomeEmail({ email, name, url }, smtp) {
  const replacements = {
    greeting: name ? `Hello ${name}` : 'Hello',
    url,
  };

  const { attributes, content } = processTemplate(readTemplate('welcome'), replacements);
  const { subject } = attributes;
  const to = name ? `"${name}" <${email}>` : email;

  return sendEmail({ to, subject }, content, smtp);
}

export async function sendAddedEmail({ email, name, url }, smtp) {
  const replacements = {
    greeting: name ? `Hello ${name}` : 'Hello',
    url,
  };

  const { attributes, content } = processTemplate(readTemplate('emailAdded'), replacements);
  const { subject } = attributes;
  const to = name ? `"${name}" <${email}>` : email;

  return sendEmail({ to, subject }, content, smtp);
}

export async function resendVerificationEmail({ email, name, url }, smtp) {
  const replacements = {
    greeting: name ? `Hello ${name}` : 'Hello',
    url,
  };

  const { attributes, content } = processTemplate(readTemplate('resend'), replacements);
  const { subject } = attributes;
  const to = name ? `"${name}" <${email}>` : email;

  return sendEmail({ to, subject }, content, smtp);
}

export async function sendResetPasswordEmail({ email, name, url }, smtp) {
  const replacements = {
    greeting: name ? `Hello ${name}` : 'Hello',
    url,
  };

  const { attributes, content } = processTemplate(readTemplate('reset'), replacements);
  const { subject } = attributes;
  const to = name ? `"${name}" <${email}>` : email;

  return sendEmail({ to, subject }, content, smtp);
}

export async function sendOrganizationInviteEmail({ email, name, organization, url }, smtp) {
  const replacements = {
    greeting: name ? `Hello ${name}` : 'Hello',
    organization,
    url,
  };

  const { attributes, content } = processTemplate(readTemplate('organizationInvite'), replacements);
  const { subject } = attributes;
  const to = name ? `"${name}" <${email}>` : email;

  return sendEmail({ to, subject }, content, smtp);
}
