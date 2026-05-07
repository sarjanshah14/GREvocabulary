-- 1. Create a trigger function that inserts into profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  
  -- Also initialize user_stats immediately
  insert into public.user_stats (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- 2. Bind the trigger to the auth.users table
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
