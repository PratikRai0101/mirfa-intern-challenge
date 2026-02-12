-- Table for storing GCM-encrypted transaction records
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "partyId" text NOT NULL,
  "payloadNonce" text NOT NULL,
  "payloadCt" text NOT NULL,
  "payloadTag" text NOT NULL,
  "dekWrapNonce" text NOT NULL,
  "dekWrapped" text NOT NULL,
  "dekWrapTag" text NOT NULL,
  "createdAt" timestamptz DEFAULT now(),
  "alg" text NOT NULL DEFAULT 'AES-256-GCM',
  "mk_version" int NOT NULL DEFAULT 1
);
