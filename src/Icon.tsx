type IconName = "tree" | "play" | "stop" | "check" | "refresh";

type IconProps = {
  name: IconName;
};

export function Icon({ name }: IconProps) {
  const shapes = {
    tree: (
      <>
        <path d="m12 3-5 6h3l-5 6h4l-4 5h14l-4-5h4l-5-6h3Z" />
        <path d="M12 20v2" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    check: <path d="m5 12 4 4L19 6" />,
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M20 12a8 8 0 1 0-2 5.3" />
      </>
    ),
  };

  return (
    <svg
      className="icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shapes[name]}
    </svg>
  );
}