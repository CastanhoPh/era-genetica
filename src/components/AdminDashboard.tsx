
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User as AuthUser } from 'firebase/auth';
import { Heart, Zap, Shield, LogOut, RefreshCw, Save } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface Character {
  id: string;
  name: string;
  photo: string;
  maxHealth: number;
  currentHealth: number;
  maxChakra: number;
  currentChakra: number;
  level: number;
}

interface AdminDashboardProps {
  adminUser: AuthUser;
  handleLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser, handleLogout }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [unsortedCharacters, setUnsortedCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const adminSettingsRef = doc(db, 'adminSettings', adminUser.uid);
  const characterOrderRef = useRef<string[]>([]);

  const sortCharacters = useCallback((chars: Character[], order: string[]): Character[] => {
    const charMap = new Map(chars.map(c => [c.id, c]));
    const sorted: Character[] = [];
    
    order.forEach(id => {
      if (charMap.has(id)) {
        sorted.push(charMap.get(id)!);
        charMap.delete(id);
      }
    });

    const remainingChars = Array.from(charMap.values());
    remainingChars.sort((a, b) => a.name.localeCompare(b.name));
    sorted.push(...remainingChars);
    
    return sorted;
  }, []);

  useEffect(() => {
    const charactersRef = collection(db, 'characters');

    const fetchOrderAndSubscribe = async () => {
      try {
        const docSnap = await getDoc(adminSettingsRef);
        if (docSnap.exists()) {
          characterOrderRef.current = docSnap.data().characterOrder || [];
        }
      } catch (e) {
        console.error("Error fetching character order:", e);
      }

      const unsubscribe = onSnapshot(charactersRef, (querySnapshot) => {
        const incomingChars = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));
        setUnsortedCharacters(incomingChars);
        
        const sortedChars = sortCharacters(incomingChars, characterOrderRef.current);
        setCharacters(sortedChars);
        setIsLoading(false);
      }, (e: any) => {
        console.error("Error fetching characters for admin:", e);
        if (e.code === 'permission-denied') {
            setError('Permissão negada. Verifique as regras de segurança do Firestore. O acesso de Admin pode levar alguns minutos para propagar.');
        } else {
            setError('Falha ao carregar os personagens.');
        }
        setIsLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribePromise = fetchOrderAndSubscribe();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [adminUser.uid, sortCharacters]);
  
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const items = Array.from(characters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = items.map(c => c.id);
    
    setCharacters(items);
    characterOrderRef.current = newOrder;

    try {
      await setDoc(adminSettingsRef, { characterOrder: newOrder }, { merge: true });
    } catch (e) {
      console.error("Error saving character order:", e);
      setError("Não foi possível salvar a nova ordem.");
    }
  };

  const handleSaveDefaultOrder = async () => {
    if (window.confirm("Tem certeza que deseja salvar a ordem atual como padrão? A ordem de reset será substituída.")) {
      try {
        await setDoc(adminSettingsRef, { defaultCharacterOrder: characterOrderRef.current }, { merge: true });
        alert("Ordem padrão salva com sucesso!");
      } catch (e) {
        console.error("Error saving default character order:", e);
        setError("Não foi possível salvar a ordem padrão.");
      }
    }
  };
  
  const handleResetOrder = async () => {
    if (window.confirm("Tem certeza que deseja resetar a ordem dos personagens para o padrão salvo?")) {
      try {
        const docSnap = await getDoc(adminSettingsRef);
        const defaultOrder = docSnap.exists() ? docSnap.data().defaultCharacterOrder || [] : [];
        
        await setDoc(adminSettingsRef, { characterOrder: defaultOrder }, { merge: true });
        characterOrderRef.current = defaultOrder;
        
        const sortedChars = sortCharacters(unsortedCharacters, defaultOrder);
        setCharacters(sortedChars);
        setError(null);
      } catch (e) {
        console.error("Error resetting character order:", e);
        setError("Não foi possível resetar a ordem para o padrão.");
      }
    }
  };

  const getPercentage = (current: number, max: number) => {
    if (current <= 0) return 0;
    return max > 0 ? (current / max) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 sm:p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Painel do Mestre</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveDefaultOrder}
              className="p-2 sm:px-4 sm:py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Salvar Padrão</span>
            </button>
            <button
              onClick={handleResetOrder}
              className="p-2 sm:px-4 sm:py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Resetar Ordem</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 sm:px-4 sm:py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {isLoading && <p className='text-center'>Carregando jogadores...</p>}
        
        {error && (
          <div className="text-red-400 text-center bg-red-900/50 p-4 rounded-lg">
            <p>{error}</p>
            <p className="mt-4 text-xs text-slate-400">Seu UID para acesso de administrador: <code className="bg-slate-700 p-1 rounded">{adminUser.uid}</code></p>
          </div>
        )}

        {!isLoading && !error && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="characters">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {characters.length === 0 ? (
                    <div className="col-span-full text-center text-slate-400 py-10">
                      <p>Nenhum jogador encontrado.</p>
                      <p className='text-sm mt-2'>Verifique se os jogadores já criaram seus personagens.</p>
                    </div>
                  ) : (
                    characters.map((char, index) => (
                      <Draggable key={char.id} draggableId={char.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-5 transform hover:scale-105 transition-transform duration-300"
                          >
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-600 flex-shrink-0">
                                <img src={char.photo || 'https://via.placeholder.com/150'} alt={char.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-white truncate">{char.name}</h2>
                                <span className='text-slate-400'>NC {char.level}</span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-1.5">
                                  <Heart className="w-4 h-4 text-red-500" />
                                  <span className="font-medium">Vida</span>
                                </div>
                                <span>{char.currentHealth} / {char.maxHealth}</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${getPercentage(char.currentHealth, char.maxHealth)}%` }}></div>
                              </div>
                            </div>

                            <div className="space-y-3 mt-4">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-1.5">
                                  <Zap className="w-4 h-4 text-purple-500" />
                                  <span className="font-medium">Chakra</span>
                                </div>
                                <span>{char.currentChakra} / {char.maxChakra}</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${getPercentage(char.currentChakra, char.maxChakra)}%` }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
