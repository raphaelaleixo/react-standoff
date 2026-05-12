// Coffin / undertaker mark — the centred sigil for Davy Jones's Cut
// (Six Feet Under). Single compound path, woodcut feel; uses
// `currentColor` so the host context controls the fill.
// Source artwork: https://www.svgrepo.com/show/326186/death-alt2.svg (CC0).
export function Coffin({ size = 64 }: { size?: number | string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label="Coffin"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M31.9618 3.95146L15.9618 3.96457L10.9724 16.9687L15.9945 43.9646L31.9945 43.9515L36.9724 16.9474L31.9618 3.95146ZM22.9798 25.9588L22.9737 18.4588L19.9737 18.4613L19.9721 16.4613L22.9721 16.4588L22.9692 12.9588L24.9692 12.9572L24.9721 16.4572L27.9721 16.4547L27.9737 18.4547L24.9737 18.4572L24.9798 25.9572L22.9798 25.9588Z"
      />
    </svg>
  );
}
