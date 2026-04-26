export function Avatar({
  name,
  color,
  size = 40,
  ring = true,
}: {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      className="rounded-full flex items-center justify-center text-black border-2 border-black"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: size * 0.38,
        boxShadow: ring ? "2px 2px 0 0 rgba(0,0,0,1)" : undefined,
      }}
    >
      {initials.toUpperCase()}
    </div>
  );
}
