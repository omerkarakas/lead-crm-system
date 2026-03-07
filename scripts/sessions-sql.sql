-- ============================================
-- Sessions Collection - PocketBase SQL Script
-- ============================================

-- 1. DROP (Mevcut tablo varsa sil)
-- ============================================================
-- Sessions tablosunu drop et
DROP TABLE IF EXISTS sessions;

-- _collections tablosundaki kaydı sil
DELETE FROM _collections WHERE name = 'sessions';

-- 2. CREATE (_collections tablosuna kayıt ekle)
-- ============================================================
INSERT INTO _collections (system, type, name, fields, indexes, listRule, viewRule, createRule, updateRule, deleteRule, options, created, updated)
VALUES (
  0,                    -- system (false)
  'base',               -- type
  'sessions',           -- name
  '[
    {"id":"usr123id","system":false,"name":"userId","type":"text","required":true,"unique":false,"options":{"min":null,"max":null,"pattern":""}},
    {"id":"tkn456id","system":false,"name":"token","type":"text","required":true,"unique":true,"options":{"min":null,"max":null,"pattern":""}},
    {"id":"lst789id","system":false,"name":"lastActive","type":"date","required":true,"unique":false,"options":{}},
    {"id":"ip012id","system":false,"name":"ipAddress","type":"text","required":false,"unique":false,"options":{"min":null,"max":null,"pattern":""}},
    {"id":"usa345id","system":false,"name":"userAgent","type":"text","required":false,"unique":false,"options":{"min":null,"max":null,"pattern":""}}
  ]',
  '[
    "CREATE UNIQUE INDEX `_sessions_token_idx` ON `sessions` (`token`)",
    "CREATE INDEX `_sessions_userId_idx` ON `sessions` (`userId`)"
  ]',
  NULL,                 -- listRule (kapalı)
  NULL,                 -- viewRule (kapalı)
  NULL,                 -- createRule (kapalı)
  NULL,                 -- updateRule (kapalı)
  NULL,                 -- deleteRule (kapalı)
  '{}',                 -- options
  datetime('now'),       -- created
  datetime('now')        -- updated
);

-- Sonuç kontrolü
SELECT '✅ Sessions collection oluşturuldu!' as result;
SELECT id, name, type FROM _collections WHERE name = 'sessions';
