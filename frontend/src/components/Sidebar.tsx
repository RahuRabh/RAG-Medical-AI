import type { ChatSessionSummary } from "../types/chat";

type SidebarProps = {
  sessions: ChatSessionSummary[];
  conversationId: string | null;
  isHistoryLoading: boolean;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  onNewConversation: () => void;
  onOpenSession: (sessionId: string) => void;
};

export function Sidebar({
  sessions,
  conversationId,
  isHistoryLoading,
  isSidebarOpen,
  onCloseSidebar,
  onNewConversation,
  onOpenSession,
}: SidebarProps) {
  return (
    <>
      <div
        className={
          isSidebarOpen ? "sidebar-overlay visible" : "sidebar-overlay"
        }
        onClick={onCloseSidebar}
      />

      <aside
        className={
          isSidebarOpen
            ? "session-sidebar session-sidebar-open"
            : "session-sidebar"
        }
      >
        <div className="sidebar-mobile-header">
          <div className="brand-block">
            <p className="eyebrow">CuraLink</p>
            <h1>AI Medical Research Assistant</h1>
          </div>

          <button
            className="sidebar-close-button"
            type="button"
            onClick={onCloseSidebar}
          >
            ✕
          </button>
        </div>

        <button
          className="create-session-button"
          type="button"
          onClick={onNewConversation}
        >
          + Create new session
        </button>

        <section className="history-section">
          <div className="sidebar-heading">
            <h2>Chat History</h2>
          </div>

          {isHistoryLoading ? (
            <p className="muted-text">Loading session...</p>
          ) : null}

          <div className="history-list">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={
                    session.id === conversationId
                      ? "history-item active"
                      : "history-item"
                  }
                  onClick={() => {
                    onOpenSession(session.id);
                    onCloseSidebar();
                  }}
                >
                  <strong>{session.title}</strong>
                </button>
              ))
            ) : (
              <p className="muted-text">
                Your saved research sessions will appear here.
              </p>
            )}
          </div>
        </section>
      </aside>
    </>
  );
}
