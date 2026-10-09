BEGIN;
CREATE TABLE IF NOT EXISTS scheme_categories (
 code TEXT PRIMARY KEY,
 label TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scheme_category_links (
 scheme_id UUID NOT NULL REFERENCES schemes(id), category_code TEXT NOT NULL REFERENCES scheme_categories(code),
 PRIMARY KEY(scheme_id,category_code)
);
CREATE TABLE IF NOT EXISTS scheme_aliases (
 id UUID PRIMARY KEY, scheme_id UUID NOT NULL REFERENCES schemes(id),
 alias TEXT NOT NULL, normalized_alias TEXT NOT NULL, language_code TEXT NOT NULL DEFAULT 'en',
 ambiguity_status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK(ambiguity_status IN ('CONFIRMED','AMBIGUOUS')),
 UNIQUE(scheme_id, normalized_alias, language_code)
);
CREATE INDEX IF NOT EXISTS scheme_aliases_lookup_idx ON scheme_aliases(normalized_alias);
CREATE TABLE IF NOT EXISTS policy_taxonomy (
 code TEXT PRIMARY KEY, label TEXT NOT NULL,
 authority_level TEXT NOT NULL CHECK(authority_level IN ('LEGISLATIVE','REGULATORY','ADMINISTRATIVE','INFORMATIONAL'))
);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS taxonomy_code TEXT REFERENCES policy_taxonomy(code);
CREATE TABLE IF NOT EXISTS policy_version_geographies (
 policy_version_id UUID NOT NULL REFERENCES policy_versions(id), geography_code TEXT NOT NULL REFERENCES geography_codes(code),
 PRIMARY KEY(policy_version_id, geography_code)
);
CREATE TABLE IF NOT EXISTS scheme_version_geographies (
 scheme_version_id UUID NOT NULL REFERENCES scheme_versions(id), geography_code TEXT NOT NULL REFERENCES geography_codes(code),
 PRIMARY KEY(scheme_version_id, geography_code)
);
CREATE TABLE IF NOT EXISTS policy_version_relations (
 source_version_id UUID NOT NULL REFERENCES policy_versions(id), target_version_id UUID NOT NULL REFERENCES policy_versions(id),
 relationship TEXT NOT NULL CHECK(relationship IN ('AMENDS','SUPERSEDES','EXPLAINS','RELATED_TO')),
 PRIMARY KEY(source_version_id,target_version_id,relationship), CHECK(source_version_id<>target_version_id)
);
ALTER TABLE scheme_policy_links ADD CONSTRAINT scheme_policy_link_type_ck CHECK (relationship IN ('GOVERNED_BY','AMENDED_BY','IMPLEMENTED_UNDER','APPLIES_TO','EXPLAINS','RELATED_TO'));
INSERT INTO policy_taxonomy(code,label,authority_level) VALUES
 ('ACT','Act','LEGISLATIVE'),('RULE','Rule','REGULATORY'),('SCHEME_GUIDELINE','Scheme Guideline','ADMINISTRATIVE'),
 ('OPERATIONAL_GUIDELINE','Operational Guideline','ADMINISTRATIVE'),('GAZETTE_NOTIFICATION','Gazette Notification','REGULATORY'),
 ('GOVERNMENT_ORDER','Government Order','ADMINISTRATIVE'),('CIRCULAR','Circular','ADMINISTRATIVE'),
 ('AMENDMENT','Amendment','ADMINISTRATIVE'),('ADVISORY','Advisory','INFORMATIONAL'),
 ('PROCUREMENT_NOTICE','Procurement Notice','ADMINISTRATIVE'),('PRESS_RELEASE','Press Release','INFORMATIONAL')
ON CONFLICT(code) DO NOTHING;
INSERT INTO scheme_categories(code,label) VALUES
 ('INCOME','Income support'),('INSURANCE','Crop insurance'),('SOLAR','Agricultural solar'),('IRRIGATION','Irrigation'),
 ('MARKETS','Agricultural markets'),('MSP_PROCUREMENT','MSP and procurement'),('CREDIT','Credit and PACS'),
 ('SOIL_HEALTH','Soil health'),('HORTICULTURE','Horticulture'),('INPUTS','Seeds and fertilizers'),
 ('MECHANIZATION','Machinery'),('FPO_COOPERATIVES','FPO and cooperatives'),('NATURAL_ORGANIC','Natural and organic farming'),
 ('LIVESTOCK_DAIRY','Livestock and dairy'),('FISHERIES','Fisheries'),('SOIL_WATER','Soil and water management'),
 ('STATE_SUBSIDIES','State subsidies'),('OTHER','Other agricultural assistance')
ON CONFLICT(code) DO NOTHING;
INSERT INTO schema_migrations(version) VALUES('0004_knowledge_model') ON CONFLICT DO NOTHING;
COMMIT;
