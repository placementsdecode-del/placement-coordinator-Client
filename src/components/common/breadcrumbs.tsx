export function Breadcrumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return <nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{items.map((item, index) => <li key={index} className="flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.onClick ? <button className="hover:text-primary hover:underline" onClick={item.onClick}>{item.label}</button> : <span aria-current="page" className="font-medium text-foreground">{item.label}</span>}</li>)}</ol></nav>;
}
