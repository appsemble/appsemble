import { logger } from '@appsemble/node-utils';
import frontmatter from 'front-matter';
import fs from 'fs';
import { template } from 'lodash';
import nodemailer from 'nodemailer';
import { markdown } from 'nodemailer-markdown';
import stubTransport from 'nodemailer-stub-transport';
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
    transport = nodemailer.createTransport(stubTransport());
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
    // Filter out fields that are unique for snapshot testing
    result.response = result.response
      .toString()
      .replace(
        /(Message-ID:\r?\n? <\w{8}-\w{4}-\w{4}-\w{4}-\w{12}@(.+)>$|Date: .+$|----_NmP.+$|boundary="--_NmP.+$)/gm,
        '',
      );

    if (process.env.NODE_ENV !== 'test') {
      logger.warn(`Mail not sent:\n${result.response}`);
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

export async function sendOrganizationInviteEmail({ email, name, organization }, smtp) {
  const replacements = {
    greeting: name ? `Hello ${name}` : 'Hello',
    organization,
  };

  const { attributes, content } = processTemplate(readTemplate('organizationInvite'), replacements);
  const { subject } = attributes;
  const to = name ? `"${name}" <${email}>` : email;

  return sendEmail({ to, subject }, content, smtp);
}
