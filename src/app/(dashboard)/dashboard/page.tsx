import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";

export default function DashboardPage() {
  const mockData = [
    { title: "Total users", value: "12k", icon: "hugeicons:user-multiple" },
    { title: "Active users", value: "10.8k", icon: "hugeicons:user-check-02" },
    { title: "Inactive users", value: "1.2k", icon: "hugeicons:user-block-02" },
    { title: "Total Listings", value: "12k", icon: "hugeicons:house-01" },
    {
      title: "Approved users",
      value: "10.8k",
      icon: "hugeicons:house-01",
    },
    { title: "Flagged users", value: "1.2k", icon: "hugeicons:house-01" },
  ] as const;

  return (
    <div className="flex-1 flex flex-col">
      <h3 className="font-semibold text-xl leading-none">Dashboard</h3>
      <section className="grid sm:grid-cols-3 gap-4 mt-8">
        {mockData.map((item) => (
          <Card
            className={item.title === "Total Listings" ? "mt-4 sm:mt-0" : ""}
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </section>
      <section className="mt-10 bg-white/[0.01] rounded-xl p-6 border border-[#262626] flex-grow min-h-[37rem] max-h-[37rem]">
        <p className="font-semibold leading-none">Recent activity</p>
      </section>
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: string;
  icon: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "bg-white/[0.01] hover:bg-white/5 rounded-xl p-4 border border-[#262626] flex items-center gap-3",
        className
      )}
    >
      <Icon icon={icon} className="text-2xl text-white/70" />
      <div>
        <p className="text-xs font-semibold text-white/70">{title}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
