import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Sun,
  Moon,
  ThumbsUp,
  ThumbsDown,
  Ticket,
  User,
  WandSparkles,
  Zap,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { supportAPI } from '../services/api';

const SUPPORT_STATUS_META = {
  open: { label: 'Open', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  in_progress: { label: 'In progress', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  resolved: { label: 'Resolved', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const SUPPORT_PRIORITY_META = {
  low: { label: 'Low', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  medium: { label: 'Medium', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  high: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-100' },
  urgent: { label: 'Urgent', className: 'bg-red-50 text-red-700 border-red-100' },
};

const defaultTicketForm = {
  subject: '',
  description: '',
  category: 'general',
  priority: 'medium',
};

const SUPPORT_ASSISTANT_NAME = 'Q-Guide';
const AUTHORIZED_ROLES = ['admin', 'superAdmin', 'canteenManager', 'canteenStaff'];

const GUIDED_SUPPORT_SCOPES = [
  {
    id: 'settings',
    label: 'Settings',
    prompts: [
      { text: 'How do I update my account settings?' },
      { text: 'My settings are not saving, what should I do?' },
      { text: 'How can I reset profile preferences?' },
      { text: 'How do I change my profile details safely?' },
      { text: 'How do I switch notification preferences from settings?' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    prompts: [
      { text: 'I am not receiving notifications, what should I check?' },
      { text: 'How do I enable QuickEats notifications?' },
      { text: 'Why are order alerts delayed?' },
      { text: 'How do I troubleshoot browser notification permissions?' },
      { text: 'Why am I getting duplicate alerts?' },
    ],
  },
  {
    id: 'account_creation',
    label: 'Account Creation',
    prompts: [
      { text: 'How do I create a new user account?' },
      { text: 'Registration fails when I sign up. What can I do?' },
      { text: 'How do I verify a newly created account?' },
      { text: 'What should I do if verification email does not arrive?' },
      { text: 'How do I recover an account if login is blocked?' },
    ],
  },
  {
    id: 'ordering',
    label: 'Ordering',
    prompts: [
      { text: 'How do I place an order from start to finish?' },
      { text: 'How do I track my latest order status?' },
      { text: 'What should I do if payment fails during checkout?' },
      { text: 'How do I cancel an order and check refund status?' },
      { text: 'How do I handle wrong or missing items in an order?' },
      {
        text: 'How do I verify order payment at pickup?',
        roles: ['canteenStaff', 'admin', 'superAdmin'],
      },
    ],
  },
  {
    id: 'group_ordering',
    label: 'Group Ordering',
    prompts: [
      { text: 'How do I create and share a group order?' },
      { text: 'How do members join with a share code?' },
      { text: 'When should we lock the group order session?' },
      { text: 'How does pay together vs pay separately work?' },
      { text: 'How do I remove inactive members from a group order?' },
    ],
  },
  {
    id: 'meal_budget',
    label: 'Meal Budget',
    prompts: [
      { text: 'How do I set a weekly meal budget?' },
      { text: 'How can I switch from weekly to monthly budget?' },
      { text: 'Where can I check current food spending?' },
      { text: 'How do I adjust budget after overspending?' },
      { text: 'How do I choose a realistic meal budget target?' },
    ],
  },
  {
    id: 'ticketing',
    label: 'Ticketing',
    prompts: [
      { text: 'How do I create a support ticket?' },
      { text: 'How can I reply to an existing ticket?' },
      { text: 'How does chat escalation to ticket work?' },
      { text: 'How do I include only relevant details in a ticket?' },
      { text: 'How do staff update ticket status after resolution?', roles: ['canteenStaff', 'admin', 'superAdmin'] },
    ],
  },
  {
    id: 'canteen_creation',
    label: 'Canteen Creation',
    prompts: [
      { text: 'How do admins create a new canteen?', roles: ['admin', 'superAdmin'] },
      { text: 'What details are required when creating a canteen?', roles: ['admin', 'superAdmin'] },
      { text: 'Who is allowed to create canteens?' },
      { text: 'How do I edit canteen details after creation?', roles: ['admin', 'superAdmin'] },
      { text: 'How do I assign staff access to a canteen?', roles: ['admin', 'superAdmin'] },
    ],
  },
];

const SupportCenterPage = () => {
  const { user } = useAuth();
  const isStaff = AUTHORIZED_ROLES.includes(user?.role);
  const hasAuthAccess = AUTHORIZED_ROLES.includes(user?.role);
  const isAdmin = ['admin', 'superAdmin'].includes(user?.role);
  const chatEndRef = useRef(null);

  const [helpContent, setHelpContent] = useState({ articles: [], categories: [], priorities: [], statuses: [] });
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [selectedGuideScopeId, setSelectedGuideScopeId] = useState('ordering');
  const [showGuidePopup, setShowGuidePopup] = useState(true);
  const [showMindmap, setShowMindmap] = useState(false);
  const [pendingChatTicket, setPendingChatTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState(defaultTicketForm);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '' });
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketStatusBusy, setTicketStatusBusy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleTickets = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    let filteredTickets = tickets;
    
    // Students can only see their own tickets
    if (user?.role === 'student') {
      filteredTickets = tickets.filter((ticket) => 
        ticket.requester?._id === user._id || ticket.requester === user._id
      );
    }
    
    // Apply search filter if there's a search query
    if (!normalized) return filteredTickets;
    return filteredTickets.filter((ticket) =>
      [ticket.subject, ticket.description, ticket.category, ticket.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [tickets, searchQuery, user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [helpRes, ticketRes] = await Promise.all([
        supportAPI.getHelpContent(),
        supportAPI.getTickets(),
      ]);
      setHelpContent(helpRes.data || {});
      setTickets(ticketRes.data?.tickets || []);
      
      // For students, only select their own first ticket
      const allTickets = ticketRes.data?.tickets || [];
      if (allTickets.length > 0) {
        if (user?.role === 'student') {
          const studentTicket = allTickets.find(ticket => 
            ticket.requester?._id === user._id || ticket.requester === user._id
          );
          if (studentTicket) {
            setSelectedTicketId(studentTicket._id);
          }
        } else {
          setSelectedTicketId((current) => current || allTickets[0]._id);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load support center');
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      setTicketsLoading(true);
      const { data } = await supportAPI.getTickets();
      const allTickets = data?.tickets || [];
      setTickets(allTickets);
      
      if (!selectedTicketId && allTickets.length) {
        if (user?.role === 'student') {
          const studentTicket = allTickets.find(ticket => 
            ticket.requester?._id === user._id || ticket.requester === user._id
          );
          if (studentTicket) {
            setSelectedTicketId(studentTicket._id);
          }
        } else {
          setSelectedTicketId(allTickets[0]._id);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not refresh tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      setSelectedMessages([]);
      return;
    }

    try {
      setDetailsLoading(true);
      const { data } = await supportAPI.getTicketById(ticketId);
      const ticket = data.ticket || null;
      // Access control is enforced server-side (403 for unauthorized tickets).
      // The requester field is sanitized out for student-role responses, so any
      // client-side ownership check against ticket.requester would always fail.
      setSelectedTicket(ticket);
      setSelectedMessages(data.messages || []);
      setTicketReply('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load ticket details');
      setSelectedTicket(null);
      setSelectedMessages([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (chatMessages.length > 0) return;

    const displayRole = user?.role === 'student' ? 'student' : 'friend';
    const nameInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || '';
    const identity = nameInitial ? `${displayRole} ${nameInitial}` : displayRole;

    setChatMessages([
      {
        role: 'assistant',
        text: `Hi ${identity}, I'm ${SUPPORT_ASSISTANT_NAME}, how can I help you?`,
      },
    ]);

    setShowGuidePopup(true);
    setShowMindmap(false);
  }, [user, chatMessages.length]);

  useEffect(() => {
    loadTicketDetails(selectedTicketId);
  }, [selectedTicketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const appendChatMessage = (role, text, meta = {}) => {
    setChatMessages((current) => [...current, { role, text, ...meta }]);
  };

  const createTicketFromRelevantMessage = async ({ message, suggestedTicket, liveContext, auto = false }) => {
    const payload = {
      subject: suggestedTicket?.subject || 'Support request from chat',
      description: message,
      category: suggestedTicket?.category || 'general',
      priority: suggestedTicket?.priority || 'medium',
      source: 'chatbot',
      metadata: {
        source: 'chatbot',
        autoCreated: auto,
        liveContext: liveContext || null,
      },
    };

    const { data } = await supportAPI.createTicket(payload);
    await loadTickets();
    setSelectedTicketId(data.ticket?._id || '');
    return data;
  };

  const sendSupportMessage = async (message) => {
    if (!message) return;

    appendChatMessage('user', message);
    setChatBusy(true);
    setIsTyping(true);
    setPendingChatTicket(null);

    try {
      const { data } = await supportAPI.chatSupport({ message, canteenId: user?.canteen || null });
      appendChatMessage('assistant', data.answer || 'I could not generate a response right now.', {
        liveContext: data.liveContext || null,
      });

      if (data.autoCreateTicket) {
        await createTicketFromRelevantMessage({
          message,
          suggestedTicket: data.suggestedTicket,
          liveContext: data.liveContext,
          auto: true,
        });
        appendChatMessage('assistant', 'I created a support ticket for this issue using your relevant message only.');
        return;
      }

      if (data.needsHumanSupport) {
        setPendingChatTicket({
          subject: data.suggestedTicket?.subject || 'Support request from chat',
          category: data.suggestedTicket?.category || 'general',
          priority: data.suggestedTicket?.priority || 'medium',
          message,
          liveContext: data.liveContext || null,
        });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not send message');
      appendChatMessage('assistant', 'I am unable to respond right now. Please use the ticket form below.');
    } finally {
      setChatBusy(false);
      setIsTyping(false);
    }
  };

  const handleSendChat = async (event) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    setChatInput('');
    await sendSupportMessage(message);
  };

  const handleGuidedPromptClick = async (prompt) => {
    await sendSupportMessage(prompt);
  };

  const handleSelectGuideTopic = (scopeId) => {
    setSelectedGuideScopeId(scopeId);
    setShowGuidePopup(false);
    setShowMindmap(true);
  };

  const handleBackToTopicPopup = () => {
    setShowGuidePopup(true);
    setShowMindmap(false);
  };

  const confirmChatEscalation = async () => {
    if (!pendingChatTicket) return;

    try {
      const { data } = await createTicketFromRelevantMessage({
        message: pendingChatTicket.message,
        suggestedTicket: pendingChatTicket,
        liveContext: pendingChatTicket.liveContext,
        auto: false,
      });
      toast.success('Support ticket created from chat');
      setPendingChatTicket(null);
      setSelectedTicketId(data.ticket?._id || '');
      appendChatMessage('assistant', 'A support ticket was created and is now visible in your ticket list.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not create ticket from chat');
    }
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    const subject = ticketForm.subject.trim();
    const description = ticketForm.description.trim();

    if (!subject || !description) {
      toast.warn('Subject and description are required');
      return;
    }

    try {
      const payload = {
        ...ticketForm,
        subject,
        description,
      };
      const { data } = await supportAPI.createTicket(payload);
      toast.success('Ticket created successfully');
      setTicketForm(defaultTicketForm);
      await loadTickets();
      setSelectedTicketId(data.ticket?._id || '');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not create ticket');
    }
  };

  const handleSendStaffNotification = async (event) => {
    event.preventDefault();
    const title = notifyForm.title.trim();
    const message = notifyForm.message.trim();
    if (!title || !message) {
      toast.warn('Title and message are required');
      return;
    }
    try {
      setNotifyBusy(true);
      const { data } = await supportAPI.broadcastStaffNotification({ title, message });
      toast.success(data.message || 'Notification sent');
      setNotifyForm({ title: '', message: '' });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not send notification');
    } finally {
      setNotifyBusy(false);
    }
  };

  const handleAddReply = async (event) => {
    event.preventDefault();
    const reply = ticketReply.trim();
    if (!reply || !selectedTicketId) return;

    try {
      await supportAPI.addTicketMessage(selectedTicketId, { message: reply });
      toast.success('Message sent');
      setTicketReply('');
      await loadTicketDetails(selectedTicketId);
      await loadTickets();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not send reply');
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedTicketId) return;
    try {
      setTicketStatusBusy(status);
      await supportAPI.updateTicketStatus(selectedTicketId, { status });
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
      await loadTicketDetails(selectedTicketId);
      await loadTickets();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update status');
    } finally {
      setTicketStatusBusy('');
    }
  };

  const handleCopyMessage = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success('Message copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy message');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name?.split(' ')[0] || 'there';
    if (hour < 12) return { text: `Good Morning, ${name}!`, icon: Sun, color: 'text-orange-500' };
    if (hour < 18) return { text: `Good Afternoon, ${name}!`, icon: Sun, color: 'text-amber-500' };
    return { text: `Good Evening, ${name}!`, icon: Moon, color: 'text-blue-500' };
  };

  const roleMatches = (roles) => !roles || roles.includes(user?.role);
  const scopedGuideTopics = GUIDED_SUPPORT_SCOPES
    .map((scope) => ({
      ...scope,
      prompts: scope.prompts.filter((prompt) => roleMatches(prompt.roles)),
    }))
    .filter((scope) => scope.prompts.length > 0);

  const selectedGuideScope = scopedGuideTopics.find((scope) => scope.id === selectedGuideScopeId) || scopedGuideTopics[0];
  const openCount = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length;
  const resolvedCount = tickets.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed').length;
  const greeting = getGreeting();

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-12 px-6 md:px-0 font-['Gilroy_Medium']">
      {/* Header Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[40px] border border-orange-100/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 md:p-12 shadow-xl shadow-orange-100/30"
      >
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fb923c 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-6 max-w-3xl">
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-xs font-['Gilroy_Heavy'] text-orange-700 shadow-sm backdrop-blur-sm">
                <LifeBuoy size={16} className="animate-pulse" />
                Support Hub
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white/90 px-4 py-2 text-xs font-['Gilroy_Heavy'] text-gray-700 shadow-sm backdrop-blur-sm">
                <greeting.icon size={16} className={greeting.color} />
                {greeting.text}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-['Gilroy_Heavy'] tracking-tight text-gray-900 leading-[1.1]">
              Help, tickets, and <br />
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                Intelligent Support.
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-600 max-w-2xl font-['Gilroy_Medium'] leading-relaxed">
              Experience the next generation of campus support. Chat with <span className="text-orange-600 font-bold">Q-Guide</span> for instant answers or manage your requests through our modernized ticket system.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:min-w-[380px]">
            <MiniStat label="Topics" value={scopedGuideTopics.length} icon={MessageSquare} accent="blue" />
            <MiniStat label="Pending" value={openCount} icon={Ticket} accent="orange" />
            <MiniStat label="Solved" value={resolvedCount} icon={CheckCircle2} accent="emerald" />
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-10">
        <div className="space-y-10">
          {/* AI Guide Section */}
          <section className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden group">
            <div className="relative overflow-hidden px-8 py-10 border-b border-gray-100 bg-gradient-to-br from-orange-50 via-white to-amber-50">
              <div className="absolute -top-14 -right-10 h-48 w-48 rounded-full bg-orange-200/30 blur-3xl group-hover:bg-orange-300/30 transition-colors duration-500" />
              <div className="absolute -bottom-16 left-1/3 h-52 w-52 rounded-full bg-amber-200/20 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fb923c 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

              <div className="relative space-y-4 max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/90 px-4 py-2 text-[11px] font-['Gilroy_Heavy'] uppercase tracking-[0.2em] text-orange-700 shadow-sm backdrop-blur-sm">
                  <WandSparkles size={14} className="text-orange-500" />
                  Intelligent Assistant
                </div>

                <h2 className="text-3xl md:text-4xl font-['Gilroy_Heavy'] tracking-tight text-gray-900 leading-tight">
                  Meet <span className="text-orange-600">{SUPPORT_ASSISTANT_NAME}</span>, <br />
                  <span className="text-2xl md:text-3xl text-gray-500 font-['Gilroy_Bold']">Your Smart Support Companion.</span>
                </h2>

                <p className="text-sm md:text-base text-gray-600 max-w-2xl leading-relaxed font-['Gilroy_Medium']">
                  Choose a support lane below to view our mini-question mindmap. Q-Guide provides instant, verified answers for your campus needs.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {['Vibrant', 'Instant', 'Accurate', '24/7 Support'].map((tag) => (
                    <span key={tag} className="rounded-full border border-orange-100 bg-white/80 px-4 py-1.5 text-xs font-['Gilroy_Bold'] text-orange-700 shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar bg-gray-50/30">
              <AnimatePresence mode="wait">
                {showGuidePopup && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_40px_rgba(249,115,22,0.05)]"
                  >
                    <div className="flex items-center gap-3 text-sm font-['Gilroy_Heavy'] text-gray-900 mb-4">
                      <div className="p-2 rounded-xl bg-orange-100/50">
                        <Zap size={18} className="text-orange-600" />
                      </div>
                      Select a Support Topic
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {scopedGuideTopics.map((scope) => (
                        <button
                          key={scope.id}
                          type="button"
                          disabled={chatBusy}
                          onClick={() => handleSelectGuideTopic(scope.id)}
                          className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-['Gilroy_Bold'] text-gray-700 text-left hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 transition-all duration-300 disabled:opacity-50"
                        >
                          {scope.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {showMindmap && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.03)]"
                  >
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3 text-sm font-['Gilroy_Heavy'] text-gray-900">
                        <div className="p-2 rounded-xl bg-orange-100/50 text-orange-600 font-bold px-3">
                          {selectedGuideScope.label.charAt(0)}
                        </div>
                        {selectedGuideScope.label} Mindmap
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToTopicPopup}
                        className="text-xs font-['Gilroy_Heavy'] text-orange-600 hover:text-orange-700 underline underline-offset-4"
                      >
                        Change Topic
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedGuideScope.prompts.map((prompt) => (
                        <button
                          key={prompt.text}
                          type="button"
                          disabled={chatBusy}
                          onClick={() => handleGuidedPromptClick(prompt.text)}
                          className="group relative rounded-2xl border border-gray-100 bg-white px-5 py-4 text-left text-sm font-['Gilroy_Bold'] text-gray-700 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3 pr-6">
                            <span className="h-2 w-2 rounded-full bg-orange-400 group-hover:scale-125 transition-transform shrink-0" />
                            <span className="leading-snug">{prompt.text}</span>
                          </div>
                          <ArrowRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4 pt-4">
                {chatMessages.map((entry, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: entry.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={`${entry.role}-${index}`}
                    className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className="flex flex-col gap-1 max-w-[85%]">
                      <div
                        className={`relative rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${entry.role === 'user'
                          ? 'bg-orange-600 text-white rounded-br-lg'
                          : 'bg-white border border-gray-100 text-gray-700 rounded-bl-lg'
                          }`}
                      >
                        {entry.text}
                        {entry.role === 'assistant' && (
                          <button 
                            onClick={() => handleCopyMessage(entry.text, index)}
                            className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-orange-600 hover:bg-orange-50"
                          >
                            {copiedMessageId === index ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          </button>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold text-gray-300 uppercase tracking-widest ${entry.role === 'user' ? 'text-right pr-2' : 'pl-2'}`}>
                        {entry.role === 'user' ? 'You' : SUPPORT_ASSISTANT_NAME}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-full px-4 py-2 flex gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            <form onSubmit={handleSendChat} className="border-t border-gray-100 p-6 bg-white flex gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your question for Q-Guide..."
                  className="w-full rounded-2xl bg-gray-50 border border-transparent pl-12 pr-6 py-4 outline-none focus:bg-white focus:border-orange-500 transition-all font-['Gilroy_Medium']"
                />
              </div>
              <button
                type="submit"
                disabled={chatBusy}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-7 py-4 text-white font-['Gilroy_Heavy'] hover:bg-orange-700 shadow-lg shadow-orange-100 tracking-wide transition-all active:scale-95 disabled:opacity-50"
              >
                {chatBusy ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Send
              </button>
            </form>
          </section>

          {/* Pending Escalation Section */}
          {pendingChatTicket && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-8 shadow-xl shadow-orange-100/50"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white border border-orange-200 px-4 py-2 text-xs font-['Gilroy_Heavy'] text-orange-700 shadow-sm">
                    <ShieldAlert size={16} />
                    Escalation Recommended
                  </div>
                  <h3 className="text-2xl font-['Gilroy_Heavy'] text-gray-900">Need a Human Touch?</h3>
                  <p className="text-sm md:text-base text-gray-600 max-w-2xl leading-relaxed">
                    If Q-Guide couldn't resolve your request, click below to create a formal ticket. Our support team will review your chat history soon.
                  </p>
                </div>
                <button
                  onClick={confirmChatEscalation}
                  className="inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-8 py-5 text-white font-['Gilroy_Heavy'] hover:bg-black shadow-lg transition-all active:scale-95"
                >
                  Create Ticket
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.section>
          )}

          {/* Create Ticket Form — hidden for admins */}
          {!isAdmin && (
            <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-['Gilroy_Heavy'] text-gray-900">Create Private Ticket</h2>
                  <p className="text-sm text-gray-500 mt-1">Open a detailed request for our campus support team.</p>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 text-gray-400">
                  <Plus size={24} />
                </div>
              </div>

              <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-['Gilroy_Heavy'] text-gray-700 mb-2">Issue Subject</label>
                  <input
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((current) => ({ ...current, subject: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-orange-500 bg-gray-50/30 transition-all"
                    placeholder="e.g., Cannot track my group order"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-['Gilroy_Heavy'] text-gray-700 mb-2">Detailed Description</label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm((current) => ({ ...current, description: e.target.value }))}
                    rows={5}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-orange-500 bg-gray-50/30 transition-all resize-none"
                    placeholder="Describe your issue with as much detail as possible..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-['Gilroy_Heavy'] text-gray-700 mb-2">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm((current) => ({ ...current, category: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-orange-500 bg-gray-50/50 appearance-none"
                  >
                    {(helpContent.categories?.length ? helpContent.categories : ['general']).map((category) => (
                      <option key={category} value={category}>
                        {category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-['Gilroy_Heavy'] text-gray-700 mb-2">Priority Level</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm((current) => ({ ...current, priority: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-orange-500 bg-gray-50/50 appearance-none"
                  >
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end pt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-3 rounded-2xl bg-orange-600 px-10 py-5 text-white font-['Gilroy_Heavy'] hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95"
                  >
                    Submit Ticket
                    <Ticket size={20} />
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Urgent Staff Notification — admin/superAdmin only */}
          {isAdmin && (
            <section className="bg-white rounded-[32px] border border-orange-100 shadow-sm p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-['Gilroy_Heavy'] text-gray-900">Urgent Staff Notification</h2>
                  <p className="text-sm text-gray-500 mt-1">Send an urgent email broadcast to all active canteen staff and managers.</p>
                </div>
                <div className="p-3 rounded-2xl bg-orange-50 text-orange-500">
                  <ShieldAlert size={24} />
                </div>
              </div>

              <form onSubmit={handleSendStaffNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-['Gilroy_Heavy'] text-gray-700 mb-2">Notification Title</label>
                  <input
                    value={notifyForm.title}
                    onChange={(e) => setNotifyForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-orange-500 bg-gray-50/30 transition-all"
                    placeholder="e.g., System maintenance from 2 PM – 4 PM today"
                  />
                </div>
                <div>
                  <label className="block text-sm font-['Gilroy_Heavy'] text-gray-700 mb-2">Message</label>
                  <textarea
                    value={notifyForm.message}
                    onChange={(e) => setNotifyForm((f) => ({ ...f, message: e.target.value }))}
                    rows={5}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-orange-500 bg-gray-50/30 transition-all resize-none"
                    placeholder="Describe the urgent matter canteen staff need to be aware of..."
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400 font-['Gilroy_Bold'] leading-relaxed max-w-sm">
                    This will email <span className="text-orange-600">all canteen staff and managers</span>. Use only for urgent operational matters.
                  </p>
                  <button
                    type="submit"
                    disabled={notifyBusy}
                    className="inline-flex items-center gap-3 rounded-2xl bg-orange-600 px-10 py-5 text-white font-['Gilroy_Heavy'] hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {notifyBusy ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                    Send Notification
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        <div className="space-y-10">
          {/* Ticket Listing Dashboard */}
          <section className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 p-8 space-y-6 flex flex-col h-full max-h-[800px]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-['Gilroy_Heavy'] text-gray-900">Your Tickets</h2>
                <p className="text-xs text-gray-400 font-['Gilroy_Bold'] tracking-widest uppercase mt-1">Live Tracking</p>
              </div>
              <button
                onClick={loadTickets}
                className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
                title="Refresh Tickets"
              >
                {ticketsLoading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCcw size={20} />}
              </button>
            </div>

            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-gray-50/50 border border-gray-100 pl-12 pr-4 py-3 outline-none focus:bg-white focus:border-orange-200 transition-all text-sm"
                placeholder="Search ticket history..."
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {visibleTickets.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-gray-100 p-12 text-center text-gray-400 bg-gray-50/30">
                  <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Ticket size={24} />
                  </div>
                  <p className="text-sm font-['Gilroy_Bold']">No tickets found</p>
                </div>
              ) : (
                visibleTickets.map((ticket) => {
                  const statusMeta = SUPPORT_STATUS_META[ticket.status] || SUPPORT_STATUS_META.open;
                  const priorityMeta = SUPPORT_PRIORITY_META[ticket.priority] || SUPPORT_PRIORITY_META.medium;
                  const active = selectedTicketId === ticket._id;
                  
                  return (
                    <button
                      key={ticket._id}
                      onClick={() => setSelectedTicketId(ticket._id)}
                      className={`w-full group relative text-left rounded-[28px] border p-5 transition-all duration-300 ${active 
                        ? 'border-orange-200 bg-orange-50/40 shadow-md shadow-orange-100/50' 
                        : 'border-gray-50 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50'}`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-orange-600 rounded-r-full" />
                      )}
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <h3 className={`font-['Gilroy_Heavy'] text-base transition-colors ${active ? 'text-orange-900' : 'text-gray-900 group-hover:text-orange-600'}`}>
                            {ticket.subject}
                          </h3>
                          <p className="text-xs text-gray-500 font-['Gilroy_Medium'] line-clamp-2 leading-relaxed italic">
                            {ticket.description}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 rounded-full border px-3 py-1 text-[10px] font-['Gilroy_Heavy'] uppercase tracking-widest ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100/50">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-['Gilroy_Bold'] uppercase tracking-widest ${priorityMeta.className}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${ticket.priority === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-current opacity-40'}`} />
                          {priorityMeta.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[10px] font-['Gilroy_Bold'] uppercase tracking-widest text-gray-500">
                          {ticket.category.replaceAll('_', ' ')}
                        </span>
                        <span className="ml-auto text-[10px] text-gray-400 font-['Gilroy_Bold']">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Ticket Management Detail View */}
      <motion.section 
        layout
        className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/30 overflow-hidden"
      >
        <div className="px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-gray-50 bg-gray-50/30">
          <div className="space-y-2">
            <h2 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">Conversation Details</h2>
            <p className="text-sm text-gray-500">Full thread and status control for your request.</p>
          </div>
          
          {selectedTicket && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</span>
                <span className={`rounded-xl border px-5 py-2 text-xs font-['Gilroy_Heavy'] uppercase tracking-widest ${SUPPORT_STATUS_META[selectedTicket.status]?.className || SUPPORT_STATUS_META.open.className}`}>
                  {SUPPORT_STATUS_META[selectedTicket.status]?.label || selectedTicket.status}
                </span>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Priority</span>
                <span className={`rounded-xl border px-5 py-2 text-xs font-['Gilroy_Heavy'] uppercase tracking-widest ${SUPPORT_PRIORITY_META[selectedTicket.priority]?.className || SUPPORT_PRIORITY_META.medium.className}`}>
                  {SUPPORT_PRIORITY_META[selectedTicket.priority]?.label || selectedTicket.priority}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-10">
          {!selectedTicketId ? (
            <div className="py-20 text-center space-y-4 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-gray-300">
                <MessageSquare size={32} />
              </div>
              <p className="text-gray-500 font-['Gilroy_Bold']">Select a ticket from the dashboard to view the message history</p>
            </div>
          ) : detailsLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4 text-gray-400">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-sm font-['Gilroy_Bold'] tracking-widest uppercase">Syncing Thread...</p>
            </div>
          ) : selectedTicket ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-10">
              <div className="space-y-8">
                {/* Main Thread */}
                <div className="space-y-6">
                  <div className="rounded-[32px] border border-gray-100 bg-gray-50/30 p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-100">
                        <Ticket size={20} />
                      </div>
                      <span className="text-xs font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-widest">Original Request</span>
                    </div>
                    <h3 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">{selectedTicket.subject}</h3>
                    <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line font-['Gilroy_Medium'] bg-white/50 p-6 rounded-2xl border border-white">
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="flex items-center gap-3 text-sm font-['Gilroy_Heavy'] text-gray-900 border-b border-gray-50 pb-4 ml-6">
                      <MessageSquare size={16} />
                      Comments & Replies
                    </h4>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      {selectedMessages.length === 0 ? (
                        <div className="py-12 text-center rounded-[28px] border border-dashed border-gray-200 text-gray-400 italic text-sm">
                          Wait for a support agent to join the conversation.
                        </div>
                      ) : (
                        selectedMessages.map((message) => {
                          const isStaffMsg = ['admin', 'superAdmin', 'canteenManager', 'canteenStaff'].includes(message.senderRole);
                          
                          return (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={message._id} 
                              className={`flex flex-col ${isStaffMsg ? 'items-start' : 'items-end'} gap-2`}
                            >
                              <div className={`max-w-[85%] rounded-[24px] p-6 shadow-sm transition-all hover:shadow-md ${isStaffMsg 
                                ? 'bg-white border border-gray-100 rounded-bl-lg' 
                                : 'bg-gray-900 text-white rounded-br-lg'}`}>
                                <div className="flex items-center justify-between gap-10 mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-['Gilroy_Heavy'] ${isStaffMsg ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                                      {isStaffMsg ? 'S' : 'Y'}
                                    </div>
                                    <div>
                                      <p className={`text-xs font-['Gilroy_Heavy'] ${isStaffMsg ? 'text-gray-900' : 'text-white'}`}>
                                        {hasAuthAccess ? (message.sender?.name || 'Canteen Support') : (isStaffMsg ? 'Support Team' : 'You')}
                                      </p>
                                      <p className="text-[9px] uppercase tracking-widest text-gray-400">{isStaffMsg ? 'Help & Support' : 'Requester'}</p>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-['Gilroy_Bold']">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <p className={`text-sm leading-relaxed ${isStaffMsg ? 'text-gray-700' : 'text-gray-100 opacity-90'}`}>{message.message}</p>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleAddReply} className="rounded-[32px] border border-orange-100 bg-orange-50/30 p-6 space-y-4 group-focus-within:border-orange-500 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-['Gilroy_Heavy'] text-orange-900 ml-4 italic">Post a reply</label>
                      <Sparkles size={16} className="text-orange-400" />
                    </div>
                    <textarea
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      rows={4}
                      className="w-full rounded-2xl bg-white border border-transparent px-6 py-5 outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all text-sm font-['Gilroy_Medium'] shadow-inner"
                      placeholder="Type your message to the support team..."
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!ticketReply.trim()}
                        className="inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-8 py-4 text-white font-['Gilroy_Heavy'] hover:bg-black shadow-lg transition-all active:scale-95 disabled:opacity-40"
                      >
                        <Send size={18} />
                        Post Message
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="space-y-8">
                {/* Meta Panel */}
                <div className="rounded-[32px] border border-gray-100 p-8 bg-gray-50/50 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="p-2 rounded-xl bg-white shadow-sm">
                      <ShieldAlert size={18} className="text-gray-400" />
                    </div>
                    <h4 className="text-base font-['Gilroy_Heavy'] text-gray-900">
                      {hasAuthAccess ? 'Request Analytics' : 'Ticket Metadata'}
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    <KeyValue label="Category" value={selectedTicket.category.replaceAll('_', ' ')} />
                    <KeyValue label="ID Ref" value={selectedTicket._id.slice(-8).toUpperCase()} />
                    {hasAuthAccess && <KeyValue label="Source" value={selectedTicket.source?.toUpperCase() || 'MANUAL'} />}
                    <KeyValue label="Created" value={new Date(selectedTicket.createdAt).toLocaleDateString()} />
                    <KeyValue label="Last Update" value={new Date(selectedTicket.updatedAt).toLocaleTimeString()} />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">
                      {hasAuthAccess ? 'Requester Details' : 'Assigned Support'}
                    </h5>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${hasAuthAccess ? 'bg-orange-600 shadow-orange-100' : 'bg-blue-600 shadow-blue-100'}`}>
                        {hasAuthAccess ? <User size={24} className="text-white" /> : <ShieldAlert size={24} className="text-white" />}
                      </div>
                      <div>
                        {hasAuthAccess ? (
                          <>
                            <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">{selectedTicket.requester?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-400 font-['Gilroy_Bold'] tracking-widest uppercase">{selectedTicket.requester?.email || 'No Email'}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">Campus Support Team</p>
                            <p className="text-[10px] text-gray-400 font-['Gilroy_Bold'] tracking-widest uppercase">Verified Response Team</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff Actions Panel */}
                {isStaff && (
                  <div className="rounded-[32px] border border-gray-100 p-8 bg-white space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Zap size={18} className="text-orange-500" />
                      <h4 className="text-base font-['Gilroy_Heavy'] text-gray-900">Admin Controls</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ActionButton label="Open" onClick={() => handleStatusUpdate('open')} loading={ticketStatusBusy === 'open'} color="gray" />
                      <ActionButton label="Progress" onClick={() => handleStatusUpdate('in_progress')} loading={ticketStatusBusy === 'in_progress'} color="blue" />
                      <ActionButton label="Resolve" onClick={() => handleStatusUpdate('resolved')} loading={ticketStatusBusy === 'resolved'} color="emerald" />
                      <ActionButton label="Close" onClick={() => handleStatusUpdate('closed')} loading={ticketStatusBusy === 'closed'} color="rose" />
                    </div>
                  </div>
                )}

                {/* Info Reminder */}
                <div className="rounded-[32px] border border-blue-100 p-8 bg-blue-50/30 group relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-100/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative flex items-center gap-4 text-blue-800 font-['Gilroy_Heavy'] mb-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Clock3 size={18} />
                    </div>
                    Service SLA
                  </div>
                  <p className="relative text-sm text-blue-900/70 font-['Gilroy_Medium'] leading-relaxed">
                    Personal requests are prioritized based on severity. Urgent billing issues are normally resolved within <span className="text-blue-900 font-bold">4 working hours</span>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500">
              The selected ticket could not be loaded.
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

const MiniStat = ({ label, value, icon: Icon, accent }) => {
  const meta = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200 shadow-blue-50',
    orange: 'bg-orange-100 text-orange-600 border-orange-200 shadow-orange-50',
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200 shadow-emerald-50'
  }[accent];

  return (
    <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.04)] backdrop-blur-md group hover:scale-105 transition-all duration-300">
      <div className={`p-2.5 rounded-2xl inline-flex mb-4 transition-transform group-hover:rotate-12 ${meta}`}>
        <Icon size={20} />
      </div>
      <div className="text-3xl font-['Gilroy_Heavy'] text-gray-900">{value}</div>
      <div className="text-[10px] font-['Gilroy_Bold'] uppercase tracking-[0.2em] text-gray-400 mt-1">{label}</div>
    </div>
  );
};

const KeyValue = ({ label, value }) => (
  <div className="flex items-center justify-between gap-6 rounded-2xl border border-gray-50 bg-white/60 px-5 py-3.5 text-sm group hover:border-orange-100 transition-colors">
    <span className="text-gray-400 font-['Gilroy_Bold'] tracking-wide">{label}</span>
    <span className="font-['Gilroy_Heavy'] text-gray-900 text-right">{value}</span>
  </div>
);

const ActionButton = ({ label, onClick, loading, color }) => {
  const colors = {
    gray: 'hover:bg-gray-100 text-gray-700 hover:border-gray-300',
    blue: 'hover:bg-blue-50 text-blue-700 hover:border-blue-200',
    emerald: 'hover:bg-emerald-50 text-emerald-600 hover:border-emerald-200',
    rose: 'hover:bg-rose-50 text-rose-600 hover:border-rose-200'
  }[color];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs font-['Gilroy_Heavy'] transition-all disabled:opacity-50 active:scale-95 ${colors}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {label}
    </button>
  );
};

export default SupportCenterPage;
