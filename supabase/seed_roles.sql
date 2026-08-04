-- Run this AFTER each person has signed in at least once (the trigger creates
-- their profiles row on first magic-link sign-in, defaulted to 'viewer').
-- Replace each email with the real address that person signed in with.

update profiles set role = 'owner', full_name = 'Kean', highlight_color = '#FFD166' where email = 'kean@example.com';
update profiles set role = 'contributor', full_name = 'Jess', highlight_color = '#A154FF' where email = 'jess@example.com';
update profiles set role = 'contributor', full_name = 'Katch', highlight_color = '#002D90' where email = 'katch@example.com';
update profiles set role = 'contributor', full_name = 'Marcel', highlight_color = '#C5EFCB' where email = 'marcel@example.com';
update profiles set role = 'contributor', full_name = 'Efren', highlight_color = '#FCB0B3' where email = 'efren@example.com';
