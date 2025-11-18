-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "genre" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(500),
    "mechanics" JSONB NOT NULL DEFAULT '{}',
    "lore" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "concept_id" UUID NOT NULL,
    "task_type" VARCHAR(50) NOT NULL,
    "model_used" VARCHAR(100) NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "tokens_used" INTEGER,
    "cost_usd" DECIMAL(10,6),
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "concept_id" UUID NOT NULL,
    "rule_name" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "message" TEXT NOT NULL,
    "suggestion" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "concepts_project_id_idx" ON "concepts"("project_id");

-- CreateIndex
CREATE INDEX "concepts_mechanics_idx" ON "concepts" USING GIN ("mechanics" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "concepts_lore_idx" ON "concepts" USING GIN ("lore" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "ai_generations_concept_id_idx" ON "ai_generations"("concept_id");

-- CreateIndex
CREATE INDEX "ai_generations_task_type_idx" ON "ai_generations"("task_type");

-- CreateIndex
CREATE INDEX "validation_results_concept_id_idx" ON "validation_results"("concept_id");

-- CreateIndex
CREATE INDEX "validation_results_severity_idx" ON "validation_results"("severity");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
