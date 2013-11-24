drop table if exists entries;
create table entries (
  id integer primary key autoincrement,
  name text,
  email text,
  password text,
  fav text
);
