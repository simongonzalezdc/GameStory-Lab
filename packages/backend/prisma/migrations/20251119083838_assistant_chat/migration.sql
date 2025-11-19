-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "target_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_proposals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "concept_id" UUID,
    "proposal_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "change_log" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "assistant_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_sessions_project_id_idx" ON "chat_sessions"("project_id");

-- CreateIndex
CREATE INDEX "chat_sessions_project_id_type_idx" ON "chat_sessions"("project_id", "type");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "assistant_proposals_session_id_idx" ON "assistant_proposals"("session_id");

-- CreateIndex
CREATE INDEX "assistant_proposals_project_id_idx" ON "assistant_proposals"("project_id");

-- CreateIndex
CREATE INDEX "assistant_proposals_project_id_status_idx" ON "assistant_proposals"("project_id", "status");

-- CreateIndex
CREATE INDEX "ai_generations_concept_id_created_at_idx" ON "ai_generations"("concept_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_generations_task_type_created_at_idx" ON "ai_generations"("task_type", "created_at");

-- CreateIndex
CREATE INDEX "concepts_project_id_created_at_idx" ON "concepts"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "concepts_project_id_version_idx" ON "concepts"("project_id", "version");

-- CreateIndex
CREATE INDEX "projects_user_id_updated_at_idx" ON "projects"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");

-- CreateIndex
CREATE INDEX "validation_results_concept_id_dismissed_idx" ON "validation_results"("concept_id", "dismissed");

-- CreateIndex
CREATE INDEX "validation_results_concept_id_severity_idx" ON "validation_results"("concept_id", "severity");

-- CreateIndex
CREATE INDEX "validation_results_dismissed_severity_idx" ON "validation_results"("dismissed", "severity");

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_proposals" ADD CONSTRAINT "assistant_proposals_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_proposals" ADD CONSTRAINT "assistant_proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_proposals" ADD CONSTRAINT "assistant_proposals_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
