import identixiaLogo from '../assets/ic_identixia.png';

type Props = {
  size?: number;
  className?: string;
};

/** Company mark — same asset as DocumentReader RN/Flutter (`ic_identixia.png`). */
export default function IdentixiaLogo({ className }: Props) {
  return (
    <div className={`logo-wrap ${className ?? ''}`.trim()}>
      <a href="https://identixia.com" target="_blank" rel="noreferrer">
        <img
          alt="Identixia"
          src={identixiaLogo}
          className="identixia-logo"
        />
      </a>
    </div>
  );
}
