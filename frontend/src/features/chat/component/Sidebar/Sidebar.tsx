import { useEffect, useState } from "react";

import type { ChatSessionSummary } from "@/types/chat";

import { useAuth } from "@/features/auth/context/useAuth";
import { useChat } from "../../context/useChat";

import { Button } from "@/components/ui/button/Button";
import { Avatar } from "@/components/ui/Avatar/Avatar";
import { UserMenu } from "@/features/settings/components/UserMenu/UserMenu";
import { SessionListItem } from "@/components/ui/SessionList/SessionListItem";

import { getInitials } from "@/utils/genInitials";

import styles from "./Sidebar.module.css";

type SidebarProps = {
  sessions: ChatSessionSummary[];
  conversationId: string | null;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  onNewConversation: () => void;
  onOpenSession: (sessionId: string) => void;
};

export function Sidebar({
  sessions,
  conversationId,
  isSidebarOpen,
  onCloseSidebar,
  onNewConversation,
  onOpenSession,
}: SidebarProps) {
  const { deleteConversation, updateConversation, isLoading } = useChat();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowUserMenu(false);
    }
  }, [isAuthenticated]);

  return (
    <>
      <div
        className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.visible : ""}`}
        onClick={onCloseSidebar}
      />

      <aside
        className={`${styles.sessionSidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarMobileHeader}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCloseSidebar}
            className={styles.xButton}
          >
            x
          </Button>
          <h1>Evidence AI - Medical Research Platform</h1>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onNewConversation}
          disabled={isLoading}
        >
          + Create new session
        </Button>

        <section className={styles.historySection}>
          <h2>Chat History</h2>

          {!isAuthenticated ? (
            <p className={styles.mutedText}>
              Your saved research sessions will appear here.
            </p>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionListItem
                key={session.id}
                title={session.title}
                isActive={session.id === conversationId}
                onSelect={() => {
                  onOpenSession(session.id);
                  onCloseSidebar();
                }}
                onDelete={ async () => {
                  if (
                    window.confirm("Are you sure you want to delete this chat?")
                  ) {
                    await deleteConversation(session.id);
                  }
                }}
                onRename={async (newTitle) => {
                  await updateConversation(session.id, newTitle)
                }}
              />
            ))
          ) : (
            <p className={styles.mutedText}>
              ✨ Get started with your medical research work!
            </p>
          )}
        </section>

        {isAuthenticated ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowUserMenu((prev) => !prev);
            }}
            className={styles.userInfo}
          >
            <p>{getInitials(user?.name)}</p>
            <Avatar src={user?.image} name={user?.name} size="md" />

            {showUserMenu && (
              <div onClick={(e) => e.stopPropagation()}>
                <UserMenu onClose={() => setShowUserMenu(false)} />
              </div>
            )}
          </div>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openAuthModal();
            }}
          >
            Log In
          </Button>
        )}
      </aside>
    </>
  );
}
