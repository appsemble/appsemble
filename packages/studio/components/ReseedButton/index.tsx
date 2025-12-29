import { Button, CardFooterButton, ModalCard } from '@appsemble/react-components';
import { type App, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { useUser } from '../UserProvider/index.js';

interface ReseedButtonProps {
  /**
   * The app to clone.
   */
  readonly app: App;
}

/**
 * Display a more detailed overview of an individual app.
 */
export function ReseedButton({ app }: ReseedButtonProps): ReactNode {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { organizations, userInfo } = useUser();

  const userRole = organizations?.find((org) => org.id === app.OrganizationId)?.role;

  const mayReseedApp =
    userRole &&
    checkOrganizationRoleOrganizationPermissions(userRole, [
      OrganizationPermission.DeleteAppResources,
      OrganizationPermission.DeleteAppAssets,
      OrganizationPermission.CreateAppResources,
      OrganizationPermission.CreateAppAssets,
    ]);

  const reseedApp = useCallback(async () => {
    await axios.post<App>(`/api/apps/${app.id}/reseed`);
    navigate(`/apps/${app.id}`);
  }, [app.id, navigate]);

  const openReseedDialog = useCallback(() => {
    navigate({ hash: 'reseed' }, { replace: true });
  }, [navigate]);

  const closeReseedDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  if (!app.demoMode) {
    return;
  }

  if (userInfo) {
    return (
      <>
        <Button className="mb-3 ml-4" onClick={openReseedDialog}>
          <FormattedMessage {...messages.reseed} />
        </Button>
        {mayReseedApp ? (
          <ModalCard
            footer={
              <>
                <CardFooterButton onClick={closeReseedDialog}>
                  <FormattedMessage {...messages.cancel} />
                </CardFooterButton>
                <CardFooterButton color="primary" onClick={reseedApp}>
                  <FormattedMessage {...messages.submit} />
                </CardFooterButton>
              </>
            }
            isActive={hash === '#reseed'}
            onClose={closeReseedDialog}
            title={<FormattedMessage {...messages.reseed} />}
          >
            <FormattedMessage {...messages.check} />
          </ModalCard>
        ) : (
          <ModalCard
            isActive={hash === '#reseed'}
            onClose={closeReseedDialog}
            title={<FormattedMessage {...messages.reseed} />}
          >
            <FormattedMessage {...messages.invalidPermissions} />
          </ModalCard>
        )}
      </>
    );
  }
}
