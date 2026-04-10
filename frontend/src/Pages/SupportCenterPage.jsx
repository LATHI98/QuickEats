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
  Ticket,
  WandSparkles,
} from 'lucide-react';
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
const ADMIN_ROLES = ['admin', 'superAdmin'];

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
  const isStaff = ['admin', 'superAdmin', 'canteenManager', 'canteenStaff'].includes(user?.role);
  const isAdminViewer = ADMIN_ROLES.includes(user?.role);
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
  const [selectedGuideScopeId, setSelectedGuideScopeId] = useState('ordering');
  const [showGuidePopup, setShowGuidePopup] = useState(true);
  const [showMindmap, setShowMindmap] = useState(false);
  const [pendingChatTicket, setPendingChatTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState(defaultTicketForm);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketStatusBusy, setTicketStatusBusy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleTickets = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return tickets;
    return tickets.filter((ticket) =>
      [ticket.subject, ticket.description, ticket.category, ticket.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [tickets, searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [helpRes, ticketRes] = await Promise.all([
        supportAPI.getHelpContent(),
        supportAPI.getTickets(),
      ]);
      setHelpContent(helpRes.data || {});
      setTickets(ticketRes.data?.tickets || []);
      if ((ticketRes.data?.tickets || []).length > 0) {
        setSelectedTicketId((current) => current || ticketRes.data.tickets[0]._id);
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
      setTickets(data?.tickets || []);
      if (!selectedTicketId && data?.tickets?.length) {
        setSelectedTicketId(data.tickets[0]._id);
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
      setSelectedTicket(data.ticket || null);
      setSelectedMessages(data.messages || []);
      setTicketReply('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load ticket details');
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-10 px-4 md:px-0">
      <section className="relative overflow-hidden rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 md:p-8 shadow-sm">
        <div className="absolute -top-20 -right-16 h-52 w-52 rounded-full bg-orange-100/70 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-amber-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-orange-700 shadow-sm">
              <LifeBuoy size={14} />
              Support center
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              Help, tickets, and AI support in one place.
            </h1>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl">
              Ask the assistant about settings, notifications, account creation, ordering, group ordering, meal budget, ticketing, and canteen creation. Menu-related and crowd monitoring topics are handled by another team.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:min-w-[320px]">
            <MiniStat label="Topics" value={scopedGuideTopics.length} icon={MessageSquare} />
            <MiniStat label="Open" value={openCount} icon={Ticket} />
            <MiniStat label="Resolved" value={resolvedCount} icon={CheckCircle2} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-8">
        <div className="space-y-8">
          <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative overflow-hidden px-6 py-7 border-b border-gray-100 bg-gradient-to-br from-orange-50 via-[#fff9ef] to-amber-100/60">
              <div className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-orange-200/35 blur-3xl" />
              <div className="absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-amber-200/35 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#fb923c 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

              <div className="relative space-y-3 max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/85 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-orange-700 shadow-sm backdrop-blur-sm">
                  <WandSparkles size={13} />
                  Meet {SUPPORT_ASSISTANT_NAME}
                </div>

                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                  Got a question?
                  <span className="block bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                    Q-Guide has the answer.
                  </span>
                </h2>

                <p className="text-sm md:text-base text-gray-600 max-w-2xl leading-relaxed">
                  Help, tickets, and smart support without the wait. Choose a topic, tap a mini-question, and get a focused answer instantly.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {['Settings', 'Orders', 'Group Orders', 'Meal Budget', 'Ticketing'].map((tag) => (
                    <span key={tag} className="rounded-full border border-white/80 bg-white/85 px-3 py-1 text-xs font-bold text-gray-700 shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar bg-[#FCFCFD]">
              {showGuidePopup && (
                <div className="rounded-3xl border border-orange-100/80 bg-white p-4 md:p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 mb-2">
                    <AlertCircle size={16} className="text-orange-600" />
                    Pick a support lane
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Choose a topic first. Q-Guide will open a mini-question mindmap for that lane.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {scopedGuideTopics.map((scope) => (
                      <button
                        key={scope.id}
                        type="button"
                        disabled={chatBusy}
                        onClick={() => handleSelectGuideTopic(scope.id)}
                        className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 px-3 py-2 text-xs font-bold text-gray-700 text-left hover:border-orange-200 hover:from-orange-50 hover:to-white transition-colors disabled:opacity-60"
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showMindmap && (
                <div className="rounded-3xl border border-gray-200/90 bg-gradient-to-br from-white via-white to-gray-50 p-4 md:p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                      <AlertCircle size={16} className="text-orange-600" />
                      {selectedGuideScope.label} mindmap
                    </div>
                    <button
                      type="button"
                      onClick={handleBackToTopicPopup}
                      className="text-xs font-bold text-orange-700 hover:text-orange-800"
                    >
                      Change topic
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Pick a mini-question and Q-Guide will return the best answer.</p>

                  <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-3 py-2 inline-flex items-center text-xs font-black uppercase tracking-[0.14em] text-orange-700 mb-4">
                    {selectedGuideScope.label}
                  </div>

                  <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedGuideScope.prompts.map((prompt) => (
                      <button
                        key={prompt.text}
                        type="button"
                        disabled={chatBusy}
                        onClick={() => handleGuidedPromptClick(prompt.text)}
                        className="group relative rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-xs md:text-sm font-bold text-gray-700 hover:border-orange-200 hover:bg-orange-50/40 transition-colors disabled:opacity-60"
                      >
                        <span className="absolute left-0 top-1/2 hidden md:block h-px w-4 -translate-x-4 bg-orange-200" />
                        <span className="inline-flex items-start gap-2">
                          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-orange-400" />
                          <span>{prompt.text}</span>
                        </span>
                        <ArrowRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((entry, index) => (
                <div
                  key={`${entry.role}-${index}`}
                  className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${entry.role === 'user'
                      ? 'bg-orange-600 text-white rounded-br-lg'
                      : 'bg-white border border-gray-100 text-gray-700 rounded-bl-lg'
                      }`}
                  >
                    {entry.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="border-t border-gray-100 p-4 bg-white flex gap-3">
              <div className="flex-1 relative">
                <MessageSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about settings, account creation, orders, group orders, meal budget, ticketing, or canteen creation..."
                  className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 outline-none focus:border-orange-400"
                />
              </div>
              <button
                type="submit"
                disabled={chatBusy}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-white font-bold hover:bg-orange-700 disabled:opacity-60"
              >
                {chatBusy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Send
              </button>
            </form>
          </section>

          {pendingChatTicket && (
            <section className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white border border-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700">
                    <ShieldAlert size={14} />
                    Escalation suggested
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">Create a support ticket from this chat?</h3>
                  <p className="text-sm text-gray-600 max-w-2xl">
                    The assistant could not fully resolve this issue. Creating a ticket will send the conversation summary to support after you confirm.
                  </p>
                </div>
                <button
                  onClick={confirmChatEscalation}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-white font-bold hover:bg-black"
                >
                  Create ticket
                  <ArrowRight size={18} />
                </button>
              </div>
            </section>
          )}

          <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Create Ticket</h2>
                <p className="text-sm text-gray-500">Open a request for billing, order issues, reservations, or general support.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600">
                <Plus size={14} />
                Manual ticket
              </div>
            </div>

            <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                <input
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm((current) => ({ ...current, subject: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="Short summary of the issue"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm((current) => ({ ...current, description: e.target.value }))}
                  rows={5}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400 resize-none"
                  placeholder="Explain what happened, when it happened, and anything the support team should know."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm((current) => ({ ...current, category: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400 bg-white"
                >
                  {(helpContent.categories?.length ? helpContent.categories : ['general']).map((category) => (
                    <option key={category} value={category}>
                      {category.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm((current) => ({ ...current, priority: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400 bg-white"
                >
                  {(helpContent.priorities?.length ? helpContent.priorities : ['low', 'medium', 'high', 'urgent']).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-white font-bold hover:bg-orange-700"
                >
                  Create ticket
                  <Ticket size={18} />
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Tickets</h2>
                <p className="text-sm text-gray-500">Track all open and resolved requests.</p>
              </div>
              <button
                onClick={loadTickets}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                {ticketsLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                Refresh
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 outline-none focus:border-orange-400"
                placeholder="Search tickets"
              />
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {visibleTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  No tickets yet.
                </div>
              ) : (
                visibleTickets.map((ticket) => {
                  const statusMeta = SUPPORT_STATUS_META[ticket.status] || SUPPORT_STATUS_META.open;
                  const priorityMeta = SUPPORT_PRIORITY_META[ticket.priority] || SUPPORT_PRIORITY_META.medium;
                  return (
                    <button
                      key={ticket._id}
                      onClick={() => setSelectedTicketId(ticket._id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${selectedTicketId === ticket._id ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-gray-900">{ticket.subject}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2">{ticket.description}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${priorityMeta.className}`}>
                          {priorityMeta.label}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          {ticket.category.replaceAll('_', ' ')}
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

      <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Ticket Details</h2>
            <p className="text-sm text-gray-500">Review the thread and continue the conversation.</p>
          </div>
          {selectedTicket && (
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${SUPPORT_STATUS_META[selectedTicket.status]?.className || SUPPORT_STATUS_META.open.className}`}>
                {SUPPORT_STATUS_META[selectedTicket.status]?.label || selectedTicket.status}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${SUPPORT_PRIORITY_META[selectedTicket.priority]?.className || SUPPORT_PRIORITY_META.medium.className}`}>
                {SUPPORT_PRIORITY_META[selectedTicket.priority]?.label || selectedTicket.priority}
              </span>
            </div>
          )}
        </div>

        {!selectedTicketId ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
            Select a ticket to view the full thread.
          </div>
        ) : detailsLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 gap-3">
            <Loader2 className="animate-spin" size={20} />
            Loading ticket...
          </div>
        ) : selectedTicket ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Summary</p>
                <h3 className="text-2xl font-extrabold text-gray-900">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{selectedTicket.description}</p>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedMessages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    No replies yet.
                  </div>
                ) : (
                  selectedMessages.map((message) => (
                    <div key={message._id} className="rounded-2xl border border-gray-100 p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-extrabold text-gray-900">{isAdminViewer ? (message.sender?.name || 'Support') : 'Support Participant'}</p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{isAdminViewer ? message.senderRole : 'private'}</p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(message.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{message.message}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddReply} className="rounded-2xl border border-gray-100 p-4 bg-gray-50/60 space-y-3">
                <label className="block text-sm font-bold text-gray-700">Reply</label>
                <textarea
                  value={ticketReply}
                  onChange={(e) => setTicketReply(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400 resize-none"
                  placeholder="Write your reply here..."
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-white font-bold hover:bg-black"
                  >
                    <Send size={18} />
                    Send reply
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 p-5 bg-gray-50/70 space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-1">Ticket info</p>
                  <h3 className="text-lg font-extrabold text-gray-900">{selectedTicket.category.replaceAll('_', ' ')}</h3>
                </div>
                <KeyValue label="Requester" value={isAdminViewer ? (selectedTicket.requester?.name || 'Unknown') : 'Visible to admins only'} />
                <KeyValue label="Email" value={isAdminViewer ? (selectedTicket.requester?.email || 'Unknown') : 'Visible to admins only'} />
                <KeyValue label="Source" value={selectedTicket.source || 'manual'} />
                <KeyValue label="Updated" value={new Date(selectedTicket.updatedAt).toLocaleString()} />
              </div>

              {isStaff && (
                <div className="rounded-2xl border border-gray-100 p-5 bg-white space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Staff actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ActionButton label="Mark open" onClick={() => handleStatusUpdate('open')} loading={ticketStatusBusy === 'open'} />
                    <ActionButton label="In progress" onClick={() => handleStatusUpdate('in_progress')} loading={ticketStatusBusy === 'in_progress'} />
                    <ActionButton label="Resolved" onClick={() => handleStatusUpdate('resolved')} loading={ticketStatusBusy === 'resolved'} />
                    <ActionButton label="Closed" onClick={() => handleStatusUpdate('closed')} loading={ticketStatusBusy === 'closed'} />
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-orange-100 p-5 bg-orange-50/40">
                <div className="flex items-center gap-2 text-orange-700 font-extrabold mb-2">
                  <Clock3 size={16} />
                  Reminder
                </div>
                <p className="text-sm text-gray-600">
                  If the chatbot could not answer your issue fully, the support team will see the chat summary when you confirm escalation.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
            The selected ticket could not be loaded.
          </div>
        )}
      </section>
    </div>
  );
};

const MiniStat = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
    <Icon size={16} className="text-orange-600 mb-2" />
    <div className="text-2xl font-extrabold text-gray-900">{value}</div>
    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">{label}</div>
  </div>
);

const KeyValue = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-bold text-gray-900 text-right">{value}</span>
  </div>
);

const ActionButton = ({ label, onClick, loading }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
    disabled={loading}
  >
    {loading ? <Loader2 size={14} className="animate-spin" /> : null}
    {label}
  </button>
);

export default SupportCenterPage;
