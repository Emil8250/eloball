import { type ReactNode } from "react";
import { toast as sonner } from "sonner";
import { Check, X, TriangleAlert, Info, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

// Custom toast renderer. We use Sonner only as the positioning/animation engine
// (toast.custom renders our JSX with zero Sonner styling) so we fully own the look:
// a content-width glass pill with a colored icon circle.

type ToastOpts = { description?: ReactNode; duration?: number };

function ToastPill({ icon, iconClass, title, description }: {
  icon: ReactNode;
  iconClass: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    // Outer wrapper fills the toast slot so the pill can center; clicks pass through
    // the empty area and only land on the pill itself.
    <div className="w-full flex justify-center pointer-events-none">
      <div
        className="eloball-pill pointer-events-auto relative isolate flex items-center gap-3 max-w-full overflow-hidden rounded-full py-2 pl-2 pr-5
                   shadow-[0_12px_32px_-8px_rgba(0,0,0,0.4)]"
      >
        {/* progressive blur — extra blur ramping in toward the bottom edge */}
        <div
          className="eloball-pill-blur pointer-events-none absolute inset-0 rounded-[inherit]
                     [mask-image:linear-gradient(to_bottom,transparent_35%,black)]
                     [-webkit-mask-image:linear-gradient(to_bottom,transparent_35%,black)]"
        />
        {/* glossy sheen along the top */}
        <div
          className="eloball-pill-fade pointer-events-none absolute inset-x-0 top-0 h-1/2
                     bg-gradient-to-b from-white/55 to-transparent dark:from-white/[0.12]"
        />
        <div className={cn("eloball-pill-fade relative shrink-0 grid place-items-center size-8 rounded-full text-white shadow-sm", iconClass)}>
          {icon}
        </div>
        <div className="eloball-pill-fade relative flex flex-col gap-0.5 min-w-0 py-0.5">
          <span className="text-sm font-bold text-foreground leading-tight">{title}</span>
          {description != null && (
            <span className="text-xs font-medium text-muted-foreground leading-snug">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}

type Variant = { icon: ReactNode; iconClass: string };

const VARIANTS = {
  success: { icon: <Check size={18} strokeWidth={3} />, iconClass: "bg-emerald-500" },
  error: { icon: <X size={18} strokeWidth={3} />, iconClass: "bg-red-500" },
  warning: { icon: <TriangleAlert size={18} strokeWidth={2.75} />, iconClass: "bg-amber-500" },
  info: { icon: <Info size={18} strokeWidth={2.75} />, iconClass: "bg-sky-500" },
  loading: { icon: <Loader2 size={18} className="animate-spin" />, iconClass: "bg-violet-500" },
  message: { icon: <Info size={18} strokeWidth={2.75} />, iconClass: "bg-neutral-500" },
} satisfies Record<string, Variant>;

function show(variant: Variant, title: ReactNode, opts?: ToastOpts) {
  return sonner.custom(
    () => (
      <ToastPill
        icon={variant.icon}
        iconClass={variant.iconClass}
        title={title}
        description={opts?.description}
      />
    ),
    { duration: opts?.duration }
  );
}

function base(title: ReactNode, opts?: ToastOpts) {
  return show(VARIANTS.message, title, opts);
}

export const toast = Object.assign(base, {
  success: (t: ReactNode, o?: ToastOpts) => show(VARIANTS.success, t, o),
  error: (t: ReactNode, o?: ToastOpts) => show(VARIANTS.error, t, o),
  warning: (t: ReactNode, o?: ToastOpts) => show(VARIANTS.warning, t, o),
  info: (t: ReactNode, o?: ToastOpts) => show(VARIANTS.info, t, o),
  message: (t: ReactNode, o?: ToastOpts) => show(VARIANTS.message, t, o),
  loading: (t: ReactNode, o?: ToastOpts) => show(VARIANTS.loading, t, { duration: Infinity, ...o }),
  dismiss: sonner.dismiss,
  custom: sonner.custom,
});
