-- Seed Data for Charities and Events

INSERT INTO public.charities (id, name, slug, description, image_url, is_featured, active, category) VALUES
('b0e2b4d1-c1e1-4b71-9c6a-1d54238db34a', 'Kids Golf Foundation', 'kids-golf-foundation', 'Bringing the sport of golf to underprivileged youth.', '/charities/kids-golf.jpg', true, true, 'Youth'),
('d2f4b5e2-e2f2-5c82-ac7b-2e65349ec45b', 'Green Earth Initiative', 'green-earth-initiative', 'Preserving natural habitats and promoting sustainable living.', '/charities/green-earth.jpg', false, true, 'Environment'),
('f4a6c7f3-f3a3-6d93-bd8c-3f7645afd56c', 'Veterans Support Network', 'veterans-support-network', 'Providing mental health and financial support for veterans.', '/charities/veterans.jpg', true, true, 'Health'),
('a1b3d5c4-a4b4-7e04-ce9d-4a8756bfe67d', 'Local Food Bank', 'local-food-bank', 'Ensuring no family goes hungry in our community.', '/charities/food-bank.jpg', false, true, 'Community'),
('c3e5f7d6-c6d6-8f15-df0e-5b9867c0f78e', 'Animal Rescue Shelter', 'animal-rescue-shelter', 'Rescuing and rehoming abandoned animals.', '/charities/animal-rescue.jpg', false, true, 'Animals'),
('e5a7b9e8-e8f8-4a26-8f1f-6c0978d1a89f', 'Tech for Tomorrow', 'tech-for-tomorrow', 'Providing laptops and internet access to students.', '/charities/tech-tomorrow.jpg', false, true, 'Education')
ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category;

INSERT INTO public.charity_events (charity_id, name, date, description) VALUES
('b0e2b4d1-c1e1-4b71-9c6a-1d54238db34a', 'Annual Junior Golf Tournament', '2026-11-14', 'A charity tournament raising funds for kids equipment.'),
('d2f4b5e2-e2f2-5c82-ac7b-2e65349ec45b', 'Tree Planting Weekend', '2026-10-25', 'Join us to plant 1000 trees.'),
('f4a6c7f3-f3a3-6d93-bd8c-3f7645afd56c', 'Heroes Gala Dinner', '2026-11-11', 'A formal dinner to honor our veterans.'),
('a1b3d5c4-a4b4-7e04-ce9d-4a8756bfe67d', 'Holiday Food Drive', '2026-12-01', 'Collecting non-perishables for the winter season.'),
('c3e5f7d6-c6d6-8f15-df0e-5b9867c0f78e', 'Adopt-a-Thon Weekend', '2026-10-10', 'Find your new best friend at our mega adoption event.'),
('e5a7b9e8-e8f8-4a26-8f1f-6c0978d1a89f', 'Code Camp 2026', '2026-11-21', 'A free coding bootcamp for high school students.');

INSERT INTO public.settings (id, pool_percent, plan_prices) VALUES
(1, 50, '{"monthly": 499, "yearly": 4999}'::jsonb)
ON CONFLICT (id) DO NOTHING;