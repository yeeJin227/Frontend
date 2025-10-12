import CategorySideBarClient from './Sidebar.client';

export default function CategorySideBar({ title }: { title: string }) {
  return <CategorySideBarClient title={title} />;
}
