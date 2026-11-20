export function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="text-xs font-medium text-destructive">{message}</p> : null;
}
