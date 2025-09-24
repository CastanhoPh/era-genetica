
import React, { useState, useEffect, useCallback } from 'react';
import { User as UserIcon, Heart, Zap, Plus, Minus, Save, Scroll, Trash2, Edit3, LogOut, AlertTriangle, BookOpen, X, Sword } from 'lucide-react';
import { User as AuthUser } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface Jutsu {
  id: string;
  name: string;
  chakraCost: number;
  healthCost: number; // Renomeado de damage
  actionType: 'Padrão' | 'Movimento' | 'Parcial';
}

interface Character {
  name: string;
  photo: string;
  maxHealth: number;
  currentHealth: number;
  maxChakra: number;
  currentChakra: number;
  level: number;
  jutsus: Jutsu[];
  notes: string;
}

interface CharacterSheetProps {
  user: AuthUser;
  handleLogout: () => void;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ user, handleLogout }) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [newJutsu, setNewJutsu] = useState<{ name: string; chakraCost: number; healthCost: number; actionType: 'Padrão' | 'Movimento' | 'Parcial'; }>({ name: '', chakraCost: 0, healthCost: 0, actionType: 'Padrão' });
  const [editingJutsu, setEditingJutsu] = useState<Jutsu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const saveCharacterToFirestore = useCallback(async (uid: string, charData: Partial<Character>) => {
    if (!uid) return;
    try {
      const characterRef = doc(db, 'characters', uid);
      await setDoc(characterRef, charData, { merge: true });
    } catch (e) {
      console.error("Error saving character:", e);
      setError("Falha ao salvar o personagem na nuvem.");
    }
  }, []);

  useEffect(() => {
    const fetchCharacter = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const characterRef = doc(db, 'characters', user.uid);
        const docSnap = await getDoc(characterRef);

        if (docSnap.exists()) {
          const charData = docSnap.data() as any; // Usar 'any' temporariamente
          // Migração de 'damage' para 'healthCost'
          const sanitizedJutsus = charData.jutsus?.map((j: any) => ({
            ...j,
            healthCost: j.healthCost ?? j.damage ?? 0, // Mapeia damage para healthCost se healthCost não existir
            damage: undefined, // Remove a propriedade antiga
            actionType: j.actionType || 'Padrão'
          })) || [];

          setCharacter({ ...charData, jutsus: sanitizedJutsus });
          setPhotoPreview(charData.photo || '');
          setLocalNotes(charData.notes || '');
        } else {
          const defaultCharacter: Character = {
            name: 'Novo Aventureiro', photo: '', maxHealth: 100, currentHealth: 100,
            maxChakra: 50, currentChakra: 50, level: 1, jutsus: [], notes: ''
          };
          setCharacter(defaultCharacter);
          setPhotoPreview('');
          setLocalNotes('');
          setIsEditing(true);
        }
      } catch (e) {
        console.error("Error fetching character data:", e);
        setError("Não foi possível carregar os dados do personagem.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchCharacter();
    }
  }, [user]);

  const handleOpenEditModal = () => {
    setEditingCharacter(character);
    setPhotoPreview(character?.photo || '');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditingCharacter(null);
    setIsEditing(false);
  };
  
  const saveCharacter = async () => {
    if (editingCharacter && user) {
      const updatedCharacter = { ...editingCharacter, photo: photoPreview };
      setCharacter(updatedCharacter);
      saveCharacterToFirestore(user.uid, updatedCharacter);
      setIsEditing(false);
      setEditingCharacter(null);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const adjustHealth = (amount: number) => {
    setCharacter(prev => {
      if (!prev) return null;
      const newHealth = Math.min(Math.max(0, prev.currentHealth + amount), prev.maxHealth);
      saveCharacterToFirestore(user.uid, { currentHealth: newHealth });
      return { ...prev, currentHealth: newHealth };
    });
  };

  const adjustChakra = (amount: number) => {
    setCharacter(prev => {
      if (!prev) return null;
      const newChakra = Math.min(Math.max(0, prev.currentChakra + amount), prev.maxChakra);
      saveCharacterToFirestore(user.uid, { currentChakra: newChakra });
      return { ...prev, currentChakra: newChakra };
    });
  };

  const addJutsu = () => {
    if (newJutsu.name.trim() && character) {
      const jutsu: Jutsu = { id: Date.now().toString(), ...newJutsu };
      const updatedJutsus = [...character.jutsus, jutsu];
      setCharacter(prev => prev && { ...prev, jutsus: updatedJutsus });
      saveCharacterToFirestore(user.uid, { jutsus: updatedJutsus });
      setNewJutsu({ name: '', chakraCost: 0, healthCost: 0, actionType: 'Padrão' });
    }
  };

  const useJutsu = (jutsu: Jutsu) => {
    if (character && character.currentChakra >= jutsu.chakraCost && character.currentHealth > jutsu.healthCost) {
      adjustChakra(-jutsu.chakraCost);
      adjustHealth(-jutsu.healthCost);
    }
  };

  const deleteJutsu = (jutsuId: string) => {
    if(!character) return;
    const updatedJutsus = character.jutsus.filter(j => j.id !== jutsuId);
    setCharacter(prev => prev && { ...prev, jutsus: updatedJutsus });
    saveCharacterToFirestore(user.uid, { jutsus: updatedJutsus });
  };

  const handleUpdateJutsu = () => {
    if (editingJutsu && character) {
      const updatedJutsus = character.jutsus.map(j => (j.id === editingJutsu.id ? editingJutsu : j));
      setCharacter(prev => prev && { ...prev, jutsus: updatedJutsus });
      saveCharacterToFirestore(user.uid, { jutsus: updatedJutsus });
      setEditingJutsu(null);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
  if (error) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4 text-center">{error}</div>;
  if (!character) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Personagem não encontrado.</div>;
  
  const getHealthPercentage = () => {
    if (character.currentHealth <= 0) return 0;
    return character.maxHealth > 0 ? (character.currentHealth / character.maxHealth) * 100 : 0;
  }
  const getChakraPercentage = () => (character.maxChakra > 0 ? (character.currentChakra / character.maxChakra) * 100 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {isEditing && editingCharacter && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-6">Editar Personagem</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white/80">Nome do personagem</label>
                  <input
                    type="text"
                    value={editingCharacter.name}
                    onChange={(e) => setEditingCharacter(prev => prev && { ...prev, name: e.target.value })}
                    placeholder="Nome do Personagem"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/80">NC</label>
                  <input
                    type="number"
                    value={editingCharacter.level}
                    onChange={(e) => setEditingCharacter(prev => prev && { ...prev, level: parseInt(e.target.value) || 0 })}
                    placeholder="Level"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/80">Vida</label>
                  <input
                    type="number"
                    value={editingCharacter.maxHealth}
                    onChange={(e) => setEditingCharacter(prev => prev && { ...prev, maxHealth: parseInt(e.target.value) || 0 })}
                    placeholder="Vida Máxima"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/80">Chakra</label>
                  <input
                    type="number"
                    value={editingCharacter.maxChakra}
                    onChange={(e) => setEditingCharacter(prev => prev && { ...prev, maxChakra: parseInt(e.target.value) || 0 })}
                    placeholder="Chakra Máximo"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/80">Foto</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button onClick={handleCancelEditing} className="px-6 py-2 text-white/80 hover:text-white transition-colors">Cancelar</button>
                <button onClick={saveCharacter} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">Salvar</button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/50 to-purple-600/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {photoPreview && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/20 flex-shrink-0">
                  <img src={photoPreview} alt={character.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{character.name || "Personagem sem nome"}</h1>
                <span className='text-blue-100'>NC {character.level}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenEditModal}
                className="p-2 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Editar</span>
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
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-white">Vida</h3>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {character.currentHealth}/{character.maxHealth}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-400 h-4 rounded-full transition-all"
                  style={{ width: `${getHealthPercentage()}%` }}
                />
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                <button onClick={() => adjustHealth(-1)} className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 transition-all">
                  <Minus className="w-6 h-6" />
                </button>
                <button onClick={() => adjustHealth(-5)} className="px-3 py-2 sm:px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 font-semibold transition-all">-5</button>
                <button onClick={() => adjustHealth(5)} className="px-3 py-2 sm:px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 font-semibold transition-all">+5</button>
                <button onClick={() => adjustHealth(1)} className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-6 h-6 text-purple-500" />
                  <h3 className="text-lg font-semibold text-white">Chakra</h3>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {character.currentChakra}/{character.maxChakra}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-400 h-4 rounded-full transition-all"
                  style={{ width: `${getChakraPercentage()}%` }}
                />
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                <button onClick={() => adjustChakra(-1)} className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-400 transition-all">
                  <Minus className="w-6 h-6" />
                </button>
                <button onClick={() => adjustChakra(-5)} className="px-3 py-2 sm:px-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 font-semibold transition-all">-5</button>
                <button onClick={() => adjustChakra(5)} className="px-3 py-2 sm:px-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 font-semibold transition-all">+5</button>
                <button onClick={() => adjustChakra(1)} className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-400 transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-6 mt-6">
          
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Jutsus e Ataques</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {character.jutsus.map((jutsu) => (
                  <div key={jutsu.id} className="group">
                    {editingJutsu?.id === jutsu.id ? (
                      <div className="bg-slate-700/50 border border-blue-500 rounded-xl p-4 space-y-4">
                        <input
                          type="text"
                          value={editingJutsu.name}
                          onChange={(e) => setEditingJutsu(prev => prev && { ...prev, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={editingJutsu.chakraCost}
                            onChange={(e) => setEditingJutsu(prev => prev && { ...prev, chakraCost: parseInt(e.target.value) || 0 })}
                            className="w-1/2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
                            placeholder="Custo de Chakra"
                          />
                          <input
                            type="number"
                            value={editingJutsu.healthCost}
                            onChange={(e) => setEditingJutsu(prev => prev && { ...prev, healthCost: parseInt(e.target.value) || 0 })}
                            className="w-1/2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
                            placeholder="Custo de Vida"
                          />
                        </div>
                        <select
                          value={editingJutsu.actionType}
                          onChange={(e) => setEditingJutsu(prev => prev && { ...prev, actionType: e.target.value as 'Padrão' | 'Movimento' | 'Parcial' })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
                        >
                          <option value="Padrão">Padrão</option>
                          <option value="Movimento">Movimento</option>
                          <option value="Parcial">Parcial</option>
                        </select>
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => setEditingJutsu(null)} className="p-2 text-slate-400 hover:text-red-400"><X className="w-5 h-5" /></button>
                          <button onClick={handleUpdateJutsu} className="p-2 text-slate-400 hover:text-green-400"><Save className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => useJutsu(jutsu)}
                        disabled={character.currentChakra < jutsu.chakraCost || character.currentHealth <= jutsu.healthCost}
                        className="w-full text-left bg-gradient-to-br from-slate-700/50 to-slate-800/30 border rounded-xl p-4 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:border-purple-400/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{jutsu.name}</h4>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Zap className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-purple-300">{jutsu.chakraCost}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-red-300">{jutsu.healthCost}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">{jutsu.actionType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingJutsu(jutsu); }} className="p-2 text-slate-400 hover:text-blue-400">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteJutsu(jutsu.id); }} className="p-2 text-slate-400 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
               {character.jutsus.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <Scroll className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Nenhum jutsu ou ataque criado ainda</p>
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-purple-400" />
                <span>Adicionar Novo Jutsu e Ataque</span>
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newJutsu.name}
                  onChange={(e) => setNewJutsu(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do Jutsu"
                  className="w-full sm:w-1/2 flex-grow px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                />
                <input
                  type="number"
                  value={newJutsu.chakraCost || ''}
                  onChange={(e) => setNewJutsu(prev => ({ ...prev, chakraCost: parseInt(e.target.value) || 0 }))}
                  placeholder="Chakra"
                  className="w-full sm:w-24 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                />
                <input
                  type="number"
                  value={newJutsu.healthCost || ''}
                  onChange={(e) => setNewJutsu(prev => ({ ...prev, healthCost: parseInt(e.target.value) || 0 }))}
                  placeholder="Vida"
                  className="w-full sm:w-24 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                />
                <select
                  value={newJutsu.actionType}
                  onChange={(e) => setNewJutsu(prev => ({ ...prev, actionType: e.target.value as 'Padrão' | 'Movimento' | 'Parcial' }))}
                  className="w-full sm:w-32 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                >
                  <option value="Padrão">Padrão</option>
                  <option value="Movimento">Movimento</option>
                  <option value="Parcial">Parcial</option>
                </select>
                <button
                  onClick={addJutsu}
                  disabled={!newJutsu.name.trim()}
                  className="w-full sm:w-auto p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CharacterSheet;
