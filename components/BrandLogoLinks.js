import Link from 'next/link';
import Image from 'next/image';
import styles from './BrandLogoLinks.module.css';

const logos = [
  ['Jeep', 'jeep.png', 'Jeep'],
  ['Mercedes-Benz', 'mercedes-benz-black.png', 'Mercedes-Benz'],
  ['Volkswagen', 'volkswagen-black.png', 'Volkswagen'],
  ['Range Rover', 'land-rover-black.png', 'Land Rover and Range Rover'],
  ['Volvo', 'volvo-black.png', 'Volvo'],
  ['Ford', 'ford.png', 'Ford'],
];

export default function BrandLogoLinks() {
  return <nav className={styles.logos} aria-label="Shop parts by vehicle brand">
    {logos.map(([brand, file, label]) => <Link key={brand}
      className={styles.link} href={`/shop?brand=${encodeURIComponent(brand)}`}
      aria-label={`Shop ${label} spare parts`}>
      <Image className={styles.image} src={`/images/brand-logos/${file}`}
        unoptimized={brand === 'Jeep'}
        alt={`${label} logo`} width={160} height={120} sizes="160px" />
    </Link>)}
  </nav>;
}
