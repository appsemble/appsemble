import { bootstrap } from '@appsemble/preact';
import { Modal } from '@appsemble/preact-components';
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

bootstrap(({ ready }) => {
  const [isActive, setActive] = useState(false);

  useEffect(() => {
    ready();
  }, [ready]);

  return (
    <div>
      <button className="button" onClick={() => setActive(true)} type="button">
        Hello
      </button>
      <Modal isActive={isActive} onClose={() => setActive(false)}>
        Hello
      </Modal>
    </div>
  );
});
