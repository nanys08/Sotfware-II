import { useState } from 'react';

export function useSnackbar() {
  const [state, setState] = useState({ visible: false, message: '' });

  const show = (msg: string) => setState({ visible: true, message: msg });
  const hide = () => setState(s => ({ ...s, visible: false }));

  return { visible: state.visible, message: state.message, show, hide };
}
