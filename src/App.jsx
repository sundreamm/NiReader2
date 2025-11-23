import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Brain, Eye, Zap, Target, Activity, 
  ChevronRight, ChevronDown, ChevronUp,
  PanelLeftClose, PanelLeftOpen,
  Printer, MessageCircle, Send, X, HelpCircle, 
  PlusSquare, MinusSquare, Workflow, GitMerge, Trash2, Sparkles,
  History, Clock, FileText, User, LogIn, LogOut, UserPlus
} from 'lucide-react';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgR78eCa155Jy62H4gXkHqndNDOZcOopE",
  authDomain: "test-3ab01.firebaseapp.com",
  projectId: "test-3ab01",
  storageBucket: "test-3ab01.firebasestorage.app",
  messagingSenderId: "822221024280",
  appId: "1:822221024280:web:61328a4f3206ecbd36a76d",
  measurementId: "G-8TYDJE60KX"
};

// Global Canvas Variables 
const __app_id_raw = typeof window.__app_id !== 'undefined' ? window.__app_id : 'ni-reader-app';
const __app_id = __app_id_raw.replace(/\//g, '-');

// --- Firebase Standard Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; 
import { getFirestore, collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'; 

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Authentication setup moved to component logic

console.log("Firebase Log: Debug mode enabled.");


const apiKey = "AIzaSyDH2eCOG4IACULi3kR0LQxOiTTqIOS1MiI";

// --- 1. 结构化回答渲染引擎 ---
function StructuralResponseRenderer({ data, fullContext }) {
  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* 1. 标题与核心逻辑摘要 */}
      <div className="border-l-4 border-current pl-5 py-2 bg-white/50 rounded-r-xl">
        <h4 className="font-bold text-lg tracking-tight opacity-90">{data.topic}</h4>
        <p className="text-base opacity-80 mt-2 leading-relaxed font-medium">{data.core_logic}</p>
        <div className="mt-3">
            <FollowUpSystem 
                contextLabel={`核心逻辑：${data.topic}`}
                contextContent={data.core_logic}
                fullContext={fullContext}
                colorTheme="indigo"
            />
        </div>
      </div>

      {/* 2. 核心洞察卡片 (NEW ORDER) */}
      {data.key_insights && data.key_insights.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {data.key_insights.map((insight, idx) => (
            <div key={idx} className="bg-white/60 p-5 rounded-xl border border-current/10 hover:bg-white/80 transition-colors">
              <div className="flex items-start gap-3 mb-2">
                <Zap size={18} className="mt-1 shrink-0 opacity-80" />
                <div>
                  <h5 className="font-bold text-base opacity-90 mb-2">{insight.title}</h5>
                  <p className="text-base opacity-80 leading-relaxed">{insight.text}</p>
                </div>
              </div>
              <div className="pl-8 mt-2">
                 <FollowUpSystem 
                    contextLabel={`关键洞察：${insight.title}`}
                    contextContent={`${insight.title}: ${insight.text}`}
                    fullContext={fullContext}
                    colorTheme="indigo"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. 逻辑流图 (NEW ORDER - Moved to last) */}
      {data.flow_steps && data.flow_steps.length > 0 && (
        <div className="bg-white/60 rounded-xl p-5 border border-current/10">
          <div className="flex items-center gap-2 mb-4 text-sm font-bold opacity-60 uppercase tracking-wider">
            <Workflow size={16} /> 逻辑推演流
          </div>
          <div className="space-y-6">
            {data.flow_steps.map((step, idx) => (
              <div key={idx} className="relative flex gap-4 group">
                {idx !== data.flow_steps.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-0 w-px bg-current/20 -z-10"></div>
                )}
                <div className="shrink-0 w-6 h-6 rounded-full bg-white border-2 border-current/30 flex items-center justify-center text-xs font-bold shadow-sm mt-1 group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <div className="flex-1 bg-white p-4 rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-all">
                  <div className="font-bold text-base text-slate-900">{step.label}</div>
                  <div className="text-sm text-slate-600 mt-2 leading-relaxed">{step.detail}</div>
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <FollowUpSystem 
                        contextLabel={`逻辑步骤 ${idx + 1}: ${step.label}`}
                        contextContent={`${step.label}: ${step.detail}`}
                        fullContext={fullContext}
                        colorTheme="slate"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 2. 通用追问系统 ---
function FollowUpSystem({ contextLabel, contextContent, fullContext, colorTheme = "indigo", onNodeCollapse }) {
  const [activeMode, setActiveMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [responseType, setResponseType] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  
  // New state to store the user's custom question for display
  const [userQuestion, setUserQuestion] = useState('');
  
  const styles = {
    indigo: { btn: 'hover:bg-indigo-100 text-indigo-600', wrapper: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
    rose: { btn: 'hover:bg-rose-100 text-rose-600', wrapper: 'bg-rose-50 border-rose-200 text-rose-900' },
    amber: { btn: 'hover:bg-amber-100 text-amber-600', wrapper: 'bg-amber-50 border-amber-200 text-amber-900' },
    slate: { btn: 'hover:bg-slate-200 text-slate-600', wrapper: 'bg-slate-100 border-slate-300 text-slate-800' },
    white: { btn: 'hover:bg-white/20 text-white', wrapper: 'bg-slate-800 border-slate-600 text-slate-100' }
  };
  const theme = styles[colorTheme] || styles.indigo;

  const handleAsk = async (queryType, queryText) => {
    if (!contextContent || !queryText.trim()) return;
    setLoading(true);
    setIsExpanded(true);
    setResponseData(null); 
    setResponseType(queryType === 'why' ? 'why' : 'custom');

    if (queryType === 'custom') {
        setUserQuestion(queryText); // Cache the question
    } else {
        setUserQuestion('');
    }
    
    try {
      const systemPrompt = `
        你是一个【Ni 视觉化逻辑引擎】。
        任务：针对用户的追问，返回一个【严格的 JSON 数据结构】，用于前端渲染卡片。
        绝对禁止：禁止输出 Markdown 文本，禁止使用 LaTeX 公式，禁止长篇大论。
        Ni 风格要求：模型化，极简。
        输出 JSON 格式：
        {
          "topic": "简短的标题",
          "core_logic": "一句话直击本质的解释。",
          "flow_steps": [ { "label": "步骤1", "detail": "描述" } ],
          "key_insights": [ { "title": "关键点", "text": "..." } ]
        }
        当前上下文：聚焦结论：${contextContent} (${contextLabel})
        用户追问：${queryText}
      `;
      
      const userPayload = `原文全貌参考：\n${fullContext}\n\n用户追问内容：${queryText}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPayload }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
          }),
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      setResponseData(parsed);

    } catch (err) {
      console.error(err);
      setResponseData({
        topic: "解析错误",
        core_logic: "无法生成结构化数据，请重试。",
        flow_steps: [],
        key_insights: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhyClick = (e) => {
    e.stopPropagation();
    if (responseData && responseType === 'why') {
      setIsExpanded(!isExpanded);
      setActiveMode(isExpanded ? null : 'why');
    } else {
      setActiveMode('why');
      handleAsk('why', `请深度解析“${contextContent}”背后的逻辑模型。`);
    }
  };

  const handleCustomClick = (e) => {
    e.stopPropagation();
    if (responseData && responseType === 'custom') {
      setIsExpanded(!isExpanded);
      setActiveMode(isExpanded ? null : 'ask');
    } else {
      if (activeMode === 'ask' && !responseData) {
        setActiveMode(null); 
        setIsExpanded(false);
      } else {
        setActiveMode('ask'); 
        setIsExpanded(true);
      }
    }
  };
  
  // NEW: Collapse logic with scroll back + Timeout for DOM stability
  const handleCollapse = (e) => {
    e.stopPropagation();
    setIsExpanded(false);
    setActiveMode(null);
    
    // Add a slight delay (100ms) to ensure the dynamic content collapses 
    // before instructing the browser to scroll.
    setTimeout(() => {
        if (onNodeCollapse) {
            onNodeCollapse(); // Scroll the parent node into view
        }
    }, 100); 
  };

  return (
    <div className={`flex flex-col items-start no-print w-full`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <button 
          onClick={handleWhyClick}
          className={`p-1.5 rounded transition-colors ${theme.btn} ${activeMode === 'why' || (responseType === 'why' && isExpanded) ? 'bg-opacity-20 ring-1 ring-current' : 'bg-transparent'}`}
        >
          <HelpCircle size={14} /> {/* 使用 HelpCircle */}
        </button>
        <button 
          onClick={handleCustomClick}
          className={`p-1.5 rounded transition-colors ${theme.btn} ${activeMode === 'ask' || (responseType === 'custom' && isExpanded) ? 'bg-opacity-20 ring-1 ring-current' : 'bg-transparent'}`}
        >
          <MessageCircle size={14} />
        </button>
      </div>

      {activeMode === 'ask' && !loading && (!responseData || responseType !== 'custom') && isExpanded && (
        <div className="mt-2 w-full flex items-center gap-2 animate-in fade-in">
          <input 
            type="text" 
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && customQuery.trim() && handleAsk('custom', customQuery)}
            placeholder="输入你的质疑 (简短)..."
            className="flex-1 text-sm p-2 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={() => handleAsk('custom', customQuery)} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            <Send size={14} />
          </button>
        </div>
      )}

      {loading && <div className="mt-2 text-xs text-slate-400 animate-pulse">构建逻辑模型中...</div>}

      {responseData && isExpanded && (
        <div className={`mt-3 w-full text-sm p-5 rounded-xl relative group animate-in fade-in border shadow-inner ${theme.wrapper}`}>
           {/* TOP HEADER CONTROLS */}
           <div className="flex items-center justify-between mb-4 border-b border-current/10 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70">
                 <Sparkles size={12} /> AI 深度解析 (Follow-Up)
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleCollapse} className="flex items-center gap-1 px-2 py-1 hover:bg-black/5 rounded transition-all text-xs font-medium opacity-70 hover:opacity-100">
                    <ChevronUp size={12} />
                </button>
                <div className="w-px h-3 bg-current opacity-20"></div>
                <button onClick={(e) => { e.stopPropagation(); setResponseData(null); setResponseType(null); setIsExpanded(false); setActiveMode(null); }} className="p-1.5 hover:bg-red-500/20 hover:text-red-600 rounded transition-all opacity-70 hover:opacity-100">
                    <Trash2 size={12}/>
                </button>
              </div>
           </div>

           {/* Custom Question Display (NEW) */}
           {responseType === 'custom' && userQuestion && (
              <div className="bg-white/80 border border-slate-200 p-3 rounded-lg mb-4 text-sm text-slate-800 italic">
                  <span className="font-bold text-indigo-600 not-italic">提问:</span> {userQuestion}
              </div>
           )}
           
           <StructuralResponseRenderer data={responseData} fullContext={fullContext} />

           {/* BOTTOM COLLAPSE CONTROL */}
           <div className="flex justify-end mt-4 pt-3 border-t border-current/10">
                <button 
                    onClick={handleCollapse} 
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all text-xs font-medium opacity-80 hover:opacity-100 border border-current/20 ${theme.btn}`}
                >
                    <ChevronUp size={12} /> 收起
                </button>
           </div>
        </div>
      )}
    </div>
  );
}

// --- 3. 递归思维节点组件 ---
const ThinkingNode = ({ node, depth = 0, index, fullText, onExpand }) => {
  const [expanded, setExpanded] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [children, setChildren] = useState(node.children || []);
  // 记录是否已尝试加载且结果为空，防止重复请求
  const [attemptedLoad, setAttemptedLoad] = useState(false);
  
  // NEW: Ref for scrolling
  const nodeRef = useRef(null); 
  
  const handleToggle = async (e) => {
    e.stopPropagation();
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    
    // 只有在未尝试加载过时，才发起请求
    if (children.length === 0 && !attemptedLoad) {
      setLoadingChildren(true);
      try {
        const newChildren = await onExpand(node);
        // 关键逻辑：如果 AI 返回了空数组，我们仍需标记 attemptedLoad
        setChildren(newChildren || []);
        setAttemptedLoad(true); 
      } catch (err) { console.error(err); } finally { setLoadingChildren(false); }
    }
  };

  // 渲染判断：是否显示展开/收起按钮？
  // 1. 如果有已加载的子节点 (children.length > 0)，显示展开/收起。
  // 2. 如果标记为可展开 (node.can_expand) 且未尝试加载 (&& !attemptedLoad)，显示 [+]。
  // 3. 否则，显示 FileText 占位符。
  const showToggleButton = children.length > 0 || (node.can_expand && !attemptedLoad);

  const isRoot = depth === 0;
  const indentLine = !isRoot && <div className="absolute top-0 bottom-0 -left-4 w-px bg-slate-200 border-l border-dashed border-slate-300"></div>;
  const connector = !isRoot && <div className="absolute top-6 -left-4 w-4 h-px bg-slate-300"></div>;

  return (
    <div className={`relative ${!isRoot ? 'ml-8' : ''} mb-4`}>
      {indentLine}
      {connector}
      <div 
        ref={nodeRef} // Attach ref here
        className={`relative rounded-xl border transition-all duration-300 cursor-default ${isRoot ? 'bg-white border-indigo-200 shadow-md' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300'}`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
             {showToggleButton ? (
               <button 
                 onClick={handleToggle} 
                 className={`shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 transition-colors text-indigo-600 cursor-pointer`}
               >
                 {loadingChildren ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : (expanded ? <MinusSquare size={16} /> : <PlusSquare size={16} />)}
               </button>
             ) : (
                // 子节点为空且已尝试加载过，或者 node.can_expand 初始就是 false
                <div className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded text-slate-300 cursor-default" title="无下一层级细节">
                   <FileText size={16} />
                </div>
             )}
             
             <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      {/* 最外层序号显示 */}
                      {isRoot && index !== undefined && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0 border border-indigo-200">
                            {index}
                        </span>
                      )}
                      <h4 className={`font-bold text-base ${isRoot ? 'text-indigo-900' : 'text-slate-800'}`}>{node.label}</h4>
                  </div>
                  {node.tag && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{node.tag}</span>}
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{node.insight}</p>
                {node.context_clue && <div className="mt-2 text-xs text-slate-400 italic flex items-center gap-1"><BookOpen size={10} /> 原文锚点: "{node.context_clue.substring(0, 30)}..."</div>}
                <div className="mt-3 border-t border-slate-100">
                    <FollowUpSystem 
                        contextLabel={node.label} 
                        contextContent={node.insight} 
                        fullContext={fullText} 
                        colorTheme={isRoot ? "indigo" : "slate"}
                        // Pass the collapse callback for scrolling
                        onNodeCollapse={() => nodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                    />
                </div>
             </div>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-200"></div>
            {children.length > 0 ? (
              <div className="pt-4">
                {children.map((child, idx) => (
                  <ThinkingNode key={child.id || idx} node={child} depth={depth + 1} fullText={fullText} onExpand={onExpand}/>
                ))}
              </div>
            ) : (!loadingChildren && <div className="ml-12 mt-2 text-xs text-slate-400 italic">无更多细分子节点可挖掘</div>)}
        </div>
      )}
    </div>
  );
};

// --- 4. 主应用组件 ---
export default function NiPhilosophyReader() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarMode, setSidebarMode] = useState('input'); // 'input' | 'history'
  const [history, setHistory] = useState([]);
  
  // Auth States
  const [user, setUser] = useState(auth.currentUser);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // 1. Firebase 认证状态监听
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
             console.log("Firebase Log: User logged in. UID:", currentUser.uid);
        } else {
             console.log("Firebase Log: User logged out.");
        }
    });
    return () => unsubscribe();
  }, []);

  // 2. 历史记录实时监听
  useEffect(() => {
    const userId = user?.uid;
    if (!userId) {
        setHistory([]);
        return; // Wait for user login
    }

    const historyCollectionPath = `artifacts/${__app_id}/users/${userId}/ni_analysis_history`;
    const q = query(collection(db, historyCollectionPath));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const fetchedHistory = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            fetchedHistory.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now(),
            });
        });
        const sortedHistory = fetchedHistory.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedHistory);
        console.log(`Firebase Log: Fetched ${fetchedHistory.length} history items.`);
      } catch(e) {
          console.error("Error reading history snapshot:", e);
      }
    });

    return () => unsubscribe(); // 清理监听器
  }, [user]); // 依赖 user 对象

  // --- Auth Handlers ---
  const handleAuth = async (isSignUp) => {
    setAuthError('');
    if (!email || !password) {
        setAuthError('邮箱和密码不能为空。');
        return;
    }

    try {
        if (isSignUp) {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("User registered successfully.");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("User signed in successfully.");
        }
        setSidebarMode('input'); // 登录成功后切换回输入模式
    } catch (err) {
        setAuthError(`认证失败: ${err.message.replace('Firebase: Error (auth/', '').replace(').', '')}`);
    }
  };

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        setTreeData(null); // 清除当前数据
        setInputText('');
        setHistory([]); // 清空历史记录
    } catch (err) {
        console.error("Sign out error:", err);
    }
  };
  
  // 3. Firestore 操作函数
  const saveToHistory = async (text, data) => {
    const userId = user?.uid;
    if (!userId) {
        console.error("Cannot save: User not authenticated.");
        return;
    }
    const historyCollectionPath = `artifacts/${__app_id}/users/${userId}/ni_analysis_history`;
    try {
        await addDoc(collection(db, historyCollectionPath), {
            textSnippet: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
            fullText: text,
            data: data,
            timestamp: serverTimestamp(), // Firestore server timestamp
        });
        console.log("Firebase Log: Analysis saved successfully.");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
  };

  const deleteHistoryItem = async (id, e) => {
    e.stopPropagation();
    const userId = user?.uid;
    if (!userId) return;
    const historyDocPath = `artifacts/${__app_id}/users/${userId}/ni_analysis_history/${id}`;
    try {
        await deleteDoc(doc(db, historyDocPath));
        console.log(`Firebase Log: Document ${id} deleted.`);
    } catch (e) {
        console.error("Error deleting document: ", e);
    }
  };

  const loadHistoryItem = (item) => {
    setInputText(item.fullText);
    setTreeData(item.data);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  
  const callGemini = async (prompt) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      }
    );
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
        console.error("Failed to parse AI JSON response:", text);
        throw new Error("AI response format error.");
    }
  };

  const analyzeText = async () => {
    if (!inputText.trim()) return;
    if (!user) {
        setError("请先登录才能进行深度分析和保存记录。");
        return;
    }

    setLoading(true);
    setTreeData(null);
    setError('');
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    try {
      const prompt = `
        你是一个【内向直觉 (Ni) 动态逻辑树引擎】。
        任务：分析复杂文本，构建一棵逻辑树。
        **输入文本：** ${inputText}
        **输出要求 (JSON)：**
        1. **roots**: 提取essence, problem, crux。
        2. **main_chain**: 逻辑推进链条节点。每个节点含: id, label, insight, context_clue, can_expand(boolean), children(array)。
        **JSON 结构：**
        {
          "roots": { "essence": "...", "problem": "...", "crux": "..." },
          "main_chain": [
             { "id": "1", "label": "...", "insight": "...", "context_clue": "...", "can_expand": true, "children": [] },
             ...
          ]
        }
      `;
      const data = await callGemini(prompt);
      setTreeData(data);
      saveToHistory(inputText, data); // 保存到 Firestore
    } catch (err) {
      setError("构建失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandNode = async (parentNode) => {
    const prompt = `
      你是一个逻辑显微镜。深入查看文本关于“${parentNode.label}”的细节。
      全文：${inputText}
      聚焦：${parentNode.label} (${parentNode.context_clue})
      任务：找出支持该节点的更细微逻辑子步骤。返回节点数组。
      JSON: [{"id": "...", "label": "...", "insight": "...", "context_clue": "...", "can_expand": true}]
    `;
    try {
      const children = await callGemini(prompt);
      return Array.isArray(children) ? children : [];
    } catch (e) { return []; }
  };

  const handlePrint = () => {
    document.body.classList.add('printing-mode');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-mode'), 500);
  };

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-800 font-sans flex flex-col overflow-hidden">
      <style>{`
        @media print {
          body > * { display: none !important; }
          body.printing-mode .print-container {
             display: block !important;
             position: absolute; top: 0; left: 0; width: 100%;
             background: white; padding: 20px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="bg-white border-b border-slate-200 h-14 shrink-0 flex items-center justify-between px-4 shadow-sm z-30 no-print">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded text-white"><Brain size={18} /></div>
          <h1 className="font-bold text-slate-900">Ni 哲学逻辑树</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
           <User size={14} className="text-indigo-500" />
           {user ? (
                <div className="flex items-center gap-2">
                    <span>{user.email || '匿名用户'}</span>
                    <button onClick={handleSignOut} className="text-slate-600 hover:text-red-500 p-1 rounded transition-colors" title="登出">
                        <LogOut size={16} />
                    </button>
                </div>
            ) : (
                <span className="text-rose-500">未登录</span>
            )}
           <button onClick={handlePrint} className="p-2 hover:bg-slate-100 rounded text-slate-600" title="打印逻辑树"><Printer size={18}/></button>
           {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded text-slate-600"><PanelLeftOpen size={18}/></button>}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 ease-in-out shadow-xl absolute md:relative h-full no-print ${isSidebarOpen ? 'w-full md:w-[400px] translate-x-0' : 'w-0 -translate-x-full opacity-0 md:w-0'}`}>
            
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-100">
                <button 
                    onClick={() => setSidebarMode('input')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${sidebarMode === 'input' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <BookOpen size={14}/> 原文输入
                </button>
                <button 
                    onClick={() => setSidebarMode('history')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${sidebarMode === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <History size={14}/> 历史记录
                </button>
                <button onClick={() => setIsSidebarOpen(false)} className="px-3 text-slate-400 hover:text-slate-600"><PanelLeftClose size={16}/></button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {sidebarMode === 'input' ? (
                    <div className="p-4 flex flex-col h-full">
                        
                        {/* Auth/Input Toggle */}
                        {user ? (
                            <div className="flex-1 flex flex-col">
                                <textarea
                                    className="flex-1 w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-sm bg-slate-50 font-serif leading-relaxed"
                                    placeholder="在此粘贴深奥的哲学文本..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <button
                                    onClick={analyzeText}
                                    disabled={loading || !inputText.trim()}
                                    className={`mt-4 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${loading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                >
                                    {loading ? "逻辑树生长中..." : <><Workflow size={16} /> 生成逻辑树</>}
                                </button>
                                {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-inner my-auto">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 justify-center">
                                    {isRegistering ? <UserPlus size={20}/> : <LogIn size={20}/>}
                                    {isRegistering ? '注册新账户' : '登录以使用'}
                                </h3>
                                
                                <input
                                    type="email"
                                    placeholder="邮箱 (Email)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="p-3 border border-slate-300 rounded-lg focus:ring-indigo-300 focus:border-indigo-500 outline-none text-sm"
                                />
                                <input
                                    type="password"
                                    placeholder="密码 (Password)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="p-3 border border-slate-300 rounded-lg focus:ring-indigo-300 focus:border-indigo-500 outline-none text-sm"
                                />

                                {authError && <div className="text-xs text-red-500 bg-red-100 p-2 rounded">{authError}</div>}
                                
                                <button
                                    onClick={() => handleAuth(isRegistering)}
                                    className="w-full py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                                >
                                    {isRegistering ? '注册并登录' : '登录'}
                                </button>
                                
                                <button
                                    onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                                    className="w-full text-xs text-indigo-500 hover:text-indigo-700 transition-colors mt-1"
                                >
                                    {isRegistering ? '已有账户？点击登录' : '没有账户？点击注册'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {!user ? (
                             <div className="text-center text-rose-500 py-10 text-sm flex flex-col items-center">
                                <LogIn size={18} className="mb-2"/>
                                请先登录以查看历史记录。
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center text-slate-400 py-10 text-sm">暂无历史记录</div>
                        ) : (
                            history.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => loadHistoryItem(item)}
                                    className="group p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock size={10} /> {new Date(item.timestamp).toLocaleString()}
                                        </div>
                                        <button 
                                            onClick={(e) => deleteHistoryItem(item.id, e)}
                                            className="text-slate-300 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="text-sm font-bold text-slate-700 line-clamp-2 font-serif">
                                        {item.textSnippet}
                                    </div>
                                    {item.data?.roots?.essence && (
                                        <div className="mt-2 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                                            {item.data.roots.essence.substring(0, 20)}...
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="flex-1 bg-slate-100/50 overflow-y-auto relative w-full print-container">
            <div className="w-full mx-auto p-4 md:p-8 min-h-full">
                {!treeData && !loading && (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-300 gap-4 select-none no-print">
                        <Workflow size={48} className="opacity-20" />
                        <p className="text-sm">等待种子（文本）...</p>
                    </div>
                )}

                {loading && (
                   <div className="h-[60vh] flex flex-col items-center justify-center gap-4 no-print">
                       <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                       <p className="text-indigo-600 font-bold animate-pulse">正在构建逻辑根基...</p>
                   </div>
                )}

                {treeData && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20">
                        <section className="relative">
                            <div className="absolute left-6 top-10 bottom-0 w-1 bg-indigo-100 rounded-full -z-10"></div>
                            <div className="flex items-center gap-2 mb-6 text-indigo-600 font-bold uppercase tracking-widest text-xs">
                                <Target size={14} /> 逻辑根基 (The Roots)
                            </div>
                            
                            <div className="space-y-4 pl-0">
                                <div className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-5 rounded-xl shadow-lg shadow-indigo-200 relative z-10">
                                    <div className="text-[10px] font-bold opacity-70 uppercase mb-1 flex items-center gap-1"><Zap size={12}/> 核心本质</div>
                                    <div className="text-lg font-bold">{treeData.roots.essence}</div>
                                    <div className="mt-2">
                                        <FollowUpSystem contextLabel="核心本质" contextContent={treeData.roots.essence} fullContext={inputText} colorTheme="white" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative z-10">
                                        <div className="text-[10px] font-bold text-rose-500 uppercase mb-1 flex items-center gap-1"><Activity size={12}/> 核心问题</div>
                                        <div className="text-sm font-medium text-slate-800">{treeData.roots.problem}</div>
                                        <div className="mt-2">
                                            <FollowUpSystem contextLabel="核心问题" contextContent={treeData.roots.problem} fullContext={inputText} colorTheme="rose" />
                                        </div>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative z-10">
                                        <div className="text-[10px] font-bold text-amber-500 uppercase mb-1 flex items-center gap-1"><Target size={12}/> 核心难点</div>
                                        <div className="text-sm font-medium text-slate-800">{treeData.roots.crux}</div>
                                        <div className="mt-2">
                                            <FollowUpSystem contextLabel="核心难点" contextContent={treeData.roots.crux} fullContext={inputText} colorTheme="amber" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold uppercase tracking-widest text-xs">
                                <GitMerge size={14} /> 逻辑推演链 (Reasoning Chain)
                            </div>
                            <div className="relative pl-2">
                                <div className="absolute -top-10 left-6 h-10 w-1 bg-indigo-100 -z-10"></div>
                                {treeData.main_chain.map((node, idx) => (
                                    <ThinkingNode 
                                        key={node.id || idx}
                                        node={node} 
                                        index={idx + 1}
                                        fullText={inputText}
                                        onExpand={handleExpandNode}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}