-- Run this AFTER creating each account in Supabase Dashboard -> Authentication -> Users
-- (the trigger creates their profiles row on account creation, defaulted to 'viewer').

update profiles set role = 'owner', full_name = 'Kean', highlight_color = '#FFD166' where email = 'keanosereno@lenden.local';
update profiles set role = 'contributor', full_name = 'Jess', highlight_color = '#A154FF' where email = 'jesscabral@lenden.local';
update profiles set role = 'contributor', full_name = 'Katch', highlight_color = '#002D90' where email = 'katchb@lenden.local';
update profiles set role = 'contributor', full_name = 'Marcel', highlight_color = '#C5EFCB' where email = 'marcelc@lenden.local';
update profiles set role = 'contributor', full_name = 'Efren', highlight_color = '#FCB0B3' where email = 'efrenf@lenden.local';
