import { useState } from 'react';

export function useSnackbar() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const show = (msg: string) => {
    setMessage(msg);
    setVisible(true);
  };

  const hide = () => setVisible(false);

  return { visible, message, show, hide };
}
