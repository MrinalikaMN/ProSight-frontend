import { useState } from 'react';
import { Input } from './ui';
import { IconEye, IconEyeOff } from './icons';

export default function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className="pr-10" {...props} />
      <button
        type="button" onClick={() => setShow(!show)}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-faint hover:text-ink cursor-pointer"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </button>
    </div>
  );
}
