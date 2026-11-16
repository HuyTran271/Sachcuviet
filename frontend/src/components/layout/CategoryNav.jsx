import './CategoryNav.css';

const categories = [
  { id: 'noi-bat', label: 'Sách nổi bật' },
  { id: 'romcom', label: 'Rom-com' },
  { id: 'van-hoc', label: 'Văn học' },
  { id: 'ky-nang', label: 'Kỹ năng sống' },
];

export default function CategoryNav() {
  return (
    <nav className="category-nav" aria-label="Danh mục sách">
      {categories.map((category) => (
        <a key={category.id} href={`#${category.id}`}>
          {category.label}
        </a>
      ))}
    </nav>
  );
}