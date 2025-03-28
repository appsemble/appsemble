import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  accept: {
    id: 'app.sjzLbX',
    defaultMessage: 'Accept',
  },
  decline: {
    id: 'app.pvtgR2',
    defaultMessage: 'Decline',
  },
  descriptionWithoutName: {
    id: 'app.6LoFIF',
    defaultMessage:
      'Do you, {email}, want to become a member of group {groupName}? If you do not want to enroll with your current account, logout now and login with the one you want to accept a membership with.',
  },
  description: {
    id: 'app.cOQTHN',
    defaultMessage:
      'Do you, {name} ({email}), want to become a member of group {groupName}? If you do not want to enroll with your current account, logout now and login with the one you want to accept a membership with.',
  },
  inviteLoadingError: {
    id: 'app.SLVblb',
    defaultMessage: 'There was a problem loading your invite.',
  },
  notFound: {
    id: 'app.0aO9Nm',
    defaultMessage: 'Your invite could not be found.',
  },
  accepted: {
    id: 'app.EuI3Ag',
    defaultMessage: 'Successfully joined {groupName}',
  },
  declined: {
    id: 'app.KTZPFD',
    defaultMessage: 'Successfully declined joining {groupName}',
  },
  submissionError: {
    id: 'app.G1UGLZ',
    defaultMessage: 'There was a problem submitting this form.',
  },
  emailConflict: {
    id: 'app.n9hgKp',
    defaultMessage: 'A group member with this email already exists.',
  },
});
