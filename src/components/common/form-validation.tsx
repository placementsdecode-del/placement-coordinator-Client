export function FieldError({ message }: { message?: string }) {
  return message ? <span role="alert" className="block text-xs font-medium text-destructive">{message}</span> : null;
}
