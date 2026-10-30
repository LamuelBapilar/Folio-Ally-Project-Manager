function daysUntil(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const due = new Date(`${dateString.slice(0, 10)}T00:00:00`);
    return Math.round((due - today) / 86400000);
  }
  
  export function dueLabel(dateString) {
    if (!dateString) return null;
  
    const days = daysUntil(dateString);
  
    if (days < 0) return { text: `${-days}d overdue`, late: true };
    if (days === 0) return { text: "Today", late: false };
    if (days === 1) return { text: "Tomorrow", late: false };
    return { text: `${days} days`, late: false };
  }
  
  // which group a story falls into for filtering
  // done stories count as "none": they show no date, so they have no deadline
  export function dueBucket(story) {
    if (story.status === "done" || !story.due_date) return "none";
  
    const days = daysUntil(story.due_date);
  
    if (days < 0) return "overdue";
    if (days === 0) return "today";
    if (days <= 7) return "week";
    return "later";
  }