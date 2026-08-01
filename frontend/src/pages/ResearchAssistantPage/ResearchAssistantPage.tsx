import { toast } from "sonner";
import { useState, FormEvent } from "react";

import { useAuth } from "@/features/auth/context/useAuth";
import { useChat } from "@/features/chat/context/useChat";
import { useSetting } from "@/features/settings/context/useSetting";

import { AuthModal } from "@/features/auth/component/AuthModal/AuthModal";

import { Sidebar } from "@/features/chat/component/Sidebar/Sidebar";
import { QuestionForm } from "@/features/chat/component/QuestionForm/QuestionForm";
import { AnswerSections } from "@/features/chat/component/AnswerSection/AnswerSection";

import { Profile } from "@/features/settings/components/Profile/Profile";
import { Security } from "@/features/settings/components/Security/Security";

import { Button } from "@/components/ui/button/Button";
import { LoadingPipeline } from "@/features/chat/component/LoadingPipeline.tsx/LoadingPipeline";

import styles from "./ResearchAssistantPage.module.css";

export function ResearchAssistantPage() {
  const { isAuthenticated, isAuthModalOpen, closeAuthModal, openAuthModal } =
    useAuth();

  const {
    sessions,
    sendMessage,
    isLoading,
    error,
    updateContext,
    conversationId,
    resetChatState,
    messages,
    isHistoryLoading,
    openSession,
    structuredContext,
  } = useChat();

  const { activeView } = useSetting();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleOpenSession = async (id: string) => {
    await openSession(id);
  };

  const executeSearchFlow = async (queryText: string) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const trimmed = queryText.trim();
    if (!trimmed) {
      toast.warning("Please type a message query or select a patient intent input");
      return;
    }

    try {
      setMessage("");
      await sendMessage(trimmed);
    } catch {
      setMessage(trimmed);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fallBackQuery = message.trim() || structuredContext.intent.trim();
    executeSearchFlow(fallBackQuery);
  };

  return (
    <main className={styles.assistantApp}>
      <Sidebar
        sessions={sessions}
        conversationId={conversationId}
        isSidebarOpen={isSidebarOpen}
        onNewConversation={resetChatState}
        onOpenSession={(id) => void handleOpenSession(id)}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      <section className={styles.researchWorkspace}>
        <section className={styles.responsePanel}>
          <div className={styles.mobileHeaderBar}>
            <Button
              type="button"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className={styles.sidebartoggleButton}
            >
              ☰
            </Button>
          </div>

          <div className={styles.chatWindow} aria-live="polite">
            {messages.length === 0 ? (
              <div className={styles.emptyLandingContainer}>
                <header className={styles.landingHero}>
                  <h1 className={styles.landingTitle}>
                    Search Trusted Medical Evidence with AI
                  </h1>
                  <p className={styles.landingTagline}>
                    EvidenceAI — Trusted Medical Research, Synthesized by AI.
                  </p>

                  <p className={styles.landingDescriptionText}>
                    An intelligent synthesis engine that translates clinical
                    intent, filters multi-source literature, and eliminates LLM
                    hallucinations using algorithmic hybrid ranking.
                  </p>
                </header>

                {/* 2. Source Grounding Trust Strip */}
                <div className={styles.trustBanner}>
                  <span className={styles.trustLabel}>
                    Grounded in literature from:
                  </span>
                  <div className={styles.trustBadges}>
                    <span className={styles.badge}>PubMed</span>
                    <span className={styles.badge}>OpenAlex</span>
                    <span className={styles.badge}>ClinicalTrials.gov</span>
                  </div>
                </div>

                {/* 3. Interactive Floating Prompt Suggestions */}
                <section className={styles.promptSection}>
                  <h3 className={styles.sectionHeading}>
                    Try starting your research session with:
                  </h3>
                  <div className={styles.promptGrid}>
                    {[
                      "Latest GLP-1 obesity studies",
                      "Compare Ozempic vs Wegovy efficacy profiles",
                      "Find ongoing trials for triple-negative breast cancer",
                      "Show contradictory findings on microplastics in cardiovascular health",
                    ].map((queryOption) => (
                      <button
                        key={queryOption}
                        type="button"
                        className={styles.floatingPromptCard}
                        onClick={() => executeSearchFlow(queryOption)}
                      >
                        <span className={styles.promptText}>{queryOption}</span>
                        <span className={styles.promptArrow}>&rarr;</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              messages?.map((item) =>
                item.role === "user" ? (
                  <article
                    className={`${styles.chatMessage} ${styles.userMessage}`}
                    key={item.id}
                  >
                    <p>{item.content}</p>
                  </article>
                ) : (
                  <article
                    className={`${styles.chatMessage} ${styles.assistantMessage}`}
                    key={item.id}
                  >
                    <AnswerSections
                      answer={item.answer}
                      sources={item.sources}
                      metadata={item.metadata}
                      isHistoryLoading={isHistoryLoading}
                    />
                  </article>
                ),
              )
            )}

            {/* If loading show loading messages */}
            {isLoading && <LoadingPipeline />}
          </div>

          <QuestionForm
            structuredContext={structuredContext}
            message={message}
            isLoading={isLoading}
            error={error}
            onSubmit={onSubmit}
            onContextChange={updateContext}
            onMessageChange={setMessage}
          />
        </section>
      </section>

      {isAuthModalOpen && (
        <div className={styles.modalOverlay} onClick={() => closeAuthModal()}>
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <AuthModal open={isAuthModalOpen} closeModal={closeAuthModal} />
          </div>
        </div>
      )}

      {activeView && (
        <section className={styles.workspaceOverlay}>
          {activeView === "profile" && <Profile />}
          {activeView === "security" && <Security />}
          {activeView === "settings" && <Security />}
        </section>
      )}
    </main>
  );
}
