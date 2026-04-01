import { Construction } from "lucide-react";

const Placeholder = ({ title }: { title: string }) => (
  <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
    <Construction className="h-12 w-12 text-muted-foreground/40 mb-4" />
    <h1 className="font-display text-2xl font-bold">{title}</h1>
    <p className="text-muted-foreground mt-1">Em desenvolvimento</p>
  </div>
);

export default Placeholder;
