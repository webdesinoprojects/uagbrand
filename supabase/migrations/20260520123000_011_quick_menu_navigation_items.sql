do $$
begin
  if not exists (
    select 1
    from public.navigation_items
    where location = 'quick_menu'
  ) then
    insert into public.navigation_items
      (location, label, href, status, sort_order)
    values
      ('quick_menu', 'Top deals', '/products?sort=deals', 'published', 1),
      ('quick_menu', 'New drops', '/products?sort=new', 'published', 2),
      ('quick_menu', 'Earbuds', '/products?category=earbuds', 'published', 3),
      ('quick_menu', 'Watches', '/products?category=smart-watch', 'published', 4),
      ('quick_menu', 'Fast delivery', '/products?delivery=fast', 'published', 5),
      ('quick_menu', 'Warranty picks', '/products?warranty=true', 'published', 6);
  end if;
end $$;

create index if not exists navigation_items_quick_menu_status_sort_idx
on public.navigation_items(status, sort_order)
where location = 'quick_menu';
