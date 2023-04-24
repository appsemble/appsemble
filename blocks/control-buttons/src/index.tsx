import { type Action, bootstrap, type IconName } from '@appsemble/sdk';

bootstrap(({ actions, data, parameters: { back, forward }, utils }) => {
  const createClickAction = (action: Action) => async (event: Event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.classList.add('is-loading');
    button.disabled = true;
    await action(data);
    button.classList.remove('is-loading');
    button.disabled = false;
  };

  const createIcon = (name: IconName): HTMLElement => (
    <span class="icon">
      <i class={utils.fa(name || 'caret-right')} />
    </span>
  );

  return (
    <div
      class={`is-flex px-2 py-2 ${
        back === false ? 'is-justify-content-flex-end' : 'is-justify-content-space-between'
      }`}
    >
      {back === false ? undefined : (
        <button class="button is-white" onclick={createClickAction(actions.onBack)} type="button">
          {createIcon(back?.icon || 'caret-left')}
          <span>{utils.formatMessage('back')}</span>
        </button>
      )}
      {forward === false ? undefined : (
        <button
          class="button is-white"
          onclick={createClickAction(actions.onForward)}
          type="button"
        >
          <span>{utils.formatMessage('forward')}</span>
          {createIcon(forward?.icon || 'caret-right')}
        </button>
      )}
    </div>
  );
});
