"use client";

import { Bell, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { CgProfile } from "react-icons/cg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image";

interface NotificationEvent {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  type: "reminder" | "calendar";
  starred?: boolean;
  error?: boolean;
}

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false); // State for delete modal
  const [isDeleting, setIsDeleting] = useState(false); // State to handle deleting state

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode(!isDarkMode);
  };

  const pages = [
    { name: "Dashboard", href: "/Dashboard" },
    { name: "Lead", href: "/Lead" },
    { name: "Invoice", href: "/invoice" },
    { name: "Task", href: "/Task" },
    { name: "Complaint", href: "/Complaint" },
    { name: "Reminder", href: "/Reminder" },
    { name: "Contact", href: "/Contact" },
  ];

  // Fetch notifications from the API
  useEffect(() => {
    if (isNotificationVisible) {
      const fetchNotifications = async () => {
        try {
          const response = await fetch(
            "http://localhost:8000/api/v1/notification/getAllNotifications"
          );
          const data = await response.json();
          if (data.success) {
            const notificationsWithStars = data.data.map((notification: NotificationEvent) => {
              const storedStarred = JSON.parse(localStorage.getItem("starredNotifications") || "{}");
              if (storedStarred[notification._id]) {
                notification.starred = true;
              }
              return notification;
            });

            notificationsWithStars.sort((a: NotificationEvent, b: NotificationEvent) => {
              if (a.error && !b.error) return -1;
              if (!a.error && b.error) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setNotifications(notificationsWithStars);
          } else {
            setError("Error fetching notifications. Please try again later.");
          }
        } catch (error) {
          console.error("Error fetching notifications. Please try again later.",error);
        }
      };

      fetchNotifications();
    }
  }, [isNotificationVisible]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/notification/deleteNotification/${id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      } else {
        alert("Failed to delete the notification.");
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      alert("Error deleting notification.");
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/notification/deleteAllNotifications",
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          setNotifications([]);
        } else {
          alert("Failed to delete all notifications.");
        }
      } else {
        alert("Error: " + data.message || "Failed to delete notifications.");
      }
    } catch (err) {
      console.error("Error clearing all notifications:", err);
      alert("Error clearing all notifications.");
    }
  };

  const toggleStar = (id: string) => {
    setNotifications((prev) => {
      const updatedNotifications = prev.map((notification) =>
        notification._id === id
          ? { ...notification, starred: !notification.starred }
          : notification
      );

      const starredNotifications = updatedNotifications.reduce((acc, notification) => {
        acc[notification._id] = notification.starred || false;
        return acc;
      }, {} as Record<string, boolean>);

      localStorage.setItem("starredNotifications", JSON.stringify(starredNotifications));

      return updatedNotifications;
    });
  };

  const toggleNotificationPanel = () => {
    setNotificationVisible(!isNotificationVisible);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.starred).length;

  const handleLogout = () => {
    // Remove the token from localStorage
    localStorage.removeItem('token'); // Replace 'token' with the key you use to store the token

    // Redirect the user to the login page
    router.push('/'); // Replace '/login' with your login route
};

const handleDeleteAccount = async () => {
  const userId = localStorage.getItem("userId"); // Get userId from localStorage
  const token = localStorage.getItem("token"); // Get authentication token if needed

  if (!userId) {
    alert("User ID not found. Please log in again.");
    handleLogout();
    return;
  }

  try {
    setIsDeleting(true);

    const response = await fetch(
      "http://localhost:8000/api/v1/user/delete-account", // Your delete endpoint
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token if authentication is required
        },
        body: JSON.stringify({ userId }),
      }
    );

    const data = await response.json();

    if (data.success) {
      
      // Remove user data from localStorage
      localStorage.removeItem("userId");
      localStorage.removeItem("token");

      // Log the user out
      handleLogout();
    } else {
      alert(data.message || "There was an error deleting your account.");
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    alert("An error occurred while deleting your account.");
  } finally {
    setIsDeleting(false);
    setDeleteModalOpen(false); // Close the modal after action
  }
};

  return (
    <nav className="fixed top-0 left-0 w-full flex justify-between items-center py-4 px-6 bg-white shadow-md z-50 dark:bg-gray-800">
      <div className="flex items-center space-x-4">
        <div className="rounded-xl w-10 h-10">
        <Image src="/1500px.png" alt="Logo" width={40} height={40} className="rounded-xl" />        </div>
        <ul className="flex items-center space-x-4">
          {pages.map((page) => (
            <li key={page.name}>
              <a
                href={page.href}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {page.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center space-x-4">
        <button onClick={toggleDarkMode} className="text-gray-600 dark:text-gray-300">
          {isDarkMode ? "☀️" : "🌙"}
        </button>
        <button onClick={toggleNotificationPanel} className="relative">
          <Bell className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full px-1">
              {unreadNotificationCount}
            </span>
          )}
        </button>
        <Link href="/Calendar">
          <Calendar className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger>
          <CgProfile className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" size={28} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem  key="viewprofile">
              <Link href='/Viewprofile'>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>LogOut</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteModalOpen(true)}>Delete Account</DropdownMenuItem>          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Delete Account</h2>
            <p className="mb-4">Are you sure you want to delete your account? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isNotificationVisible && (
        <div className="fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-lg border-l border-gray-200 z-50 p-4 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h2>
            <button
              onClick={() => setNotificationVisible(false)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-end mb-4">
            <button
              onClick={clearAllNotifications}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
            >
              Clear All Notifications
            </button>
          </div>
          <div className="notification-inbox overflow-y-auto h-full scrollbar-hide">
            {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
            {!error && notifications.length === 0 && (
              <div className="flex justify-center items-center text-gray-500 dark:text-gray-400">
                <p>No new notifications</p>
              </div>
            )}
            {!error && notifications.length > 0 && (
              <ul className="space-y-4">
                {notifications.map((notification) => {
                  const targetPage =
                    notification.type === "reminder"
                      ? "/Reminder"
                      : notification.type === "calendar"
                      ? "/Calendar"
                      : null;

                  return (
                    <li
                      key={notification._id}
                      className={`flex justify-between items-start p-4 rounded-lg shadow-md transition-all cursor-pointer ${
                        notification.starred
                          ? "bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-100"
                          : notification.type === "reminder"
                          ? "bg-blue-50 text-blue-800 border-l-4 border-blue-500 dark:bg-blue-900 dark:text-blue-100"
                          : notification.type === "calendar"
                          ? "bg-red-50 text-red-800 border-l-4 border-red-500 dark:bg-red-900 dark:text-red-100"
                          : "bg-gray-50 text-gray-800 border-l-4 border-gray-400 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <Link href={targetPage || "#"} passHref>
                        <div className="flex-1">
                          <h4 className="font-bold text-md">{notification.title}</h4>
                          <p className="text-sm mt-1">{notification.message}</p>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(notification._id);
                        }}
                        className="mr-2 text-yellow-500 hover:text-yellow-700 dark:text-yellow-300 dark:hover:text-yellow-500"
                      >
                        {notification.starred ? "★" : "☆"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 transition"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
