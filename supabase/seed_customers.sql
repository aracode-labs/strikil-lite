-- ============================================
-- Strikil Lite - Seed Data Pelanggan
-- Dihasilkan dari: Pelanggan_Strikil_Kontak_Baju.csv
-- Jumlah: 51 pelanggan
--
-- CARA PAKAI:
--  1. Buka Supabase Dashboard -> SQL Editor
--  2. Paste seluruh isi file ini
--  3. Klik RUN
-- ============================================

insert into public.customers (nama, hp) values
  ('Bu Surya', '089630055445'),
  ('Bu Shanty', '081320326744'),
  ('Bu Tresna', '082121796030'),
  ('Bu Desi (Pemda)', '081224324474'),
  ('Bu Niken', '082219179672'),
  ('Bu Winda', '081386029300'),
  ('Bu Arie', '081224557360'),
  ('Bu Desi (Budi)', '081214180181'),
  ('Teh Eni', '085320100806'),
  ('Bu Budi (IPUNG)', '082115174613'),
  ('Bu Riska', '087822019906'),
  ('Bu Hari', '082320672650'),
  ('Bu Fitri', '082117840180'),
  ('Bu Mia', '085722191696'),
  ('Bu Ross Ridha Syifa Akh tar Z', '081320930326'),
  ('Bu Linda (Smk)', '081312517769'),
  ('Bu Erna', '085323247658'),
  ('Bu Ibnu', '085720200986'),
  ('Bu Linda (Mamah Bu Ris ka)', '081394002043'),
  ('Bu Neni', '082214689071'),
  ('Teh Nurhayati', '085721355538'),
  ('Bu Diana Safiq', '081902400148'),
  ('Bu Fenny', '081802228014'),
  ('Bu Mira', '081322185995'),
  ('Neni herlina', '085710631342'),
  ('Bu Icha', '087809988399'),
  ('Bu Lyna', '085794828939'),
  ('Bu Tree Sapta', '082240642570'),
  ('Bu Dudi (Kavling Cengk eh)', '081214938745'),
  ('Bu Sarah Pahlepi', '085216325582'),
  ('Bu Alpari Opinda', '081311751756'),
  ('Bu Evi', '081322779595'),
  ('Bu Inneke', '0811203993'),
  ('Bu Siti Muslikhah', '0817614966'),
  ('Bu Heni', '081320302333'),
  ('Bu Susan', '08112337752'),
  ('Bu Lia (AhmadRaufakhari ts)', '089505815223'),
  ('dri_viani', '087880808989'),
  ('Bu Hari (Mah Luthfi&Rad if)', '089669099281'),
  ('Bu Mahmudah (Abiy Hafizh)', '082149075136'),
  ('Bu Ade Pojok (Enny Era wati)', '082111514422'),
  ('Fitriani hayati Dewi (Bu Eri)', '082127268090'),
  ('Bu Ida (Nusasari)', '081321681469'),
  ('Bu Nanda', '085715063202'),
  ('Bu Rayya', '081222268544'),
  ('sofi', '081912222879'),
  ('Bu Rizma', '082116238444'),
  ('Bu Agus (Noer Asih Ning rum)', '081394343309'),
  ('Dalies Pujiyanti_18.038 4', '081321884835'),
  ('Bu Setiawati', '085860165620'),
  ('Bu Emi Yoestine', '081394269195');

-- Tampilkan hasil:
select nama, hp from public.customers order by nama asc;
