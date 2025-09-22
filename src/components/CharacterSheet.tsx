import React, { useState, useEffect } from 'react';
import { User, Heart, Zap, Plus, Minus, Camera, Save, Scroll, Trash2, Edit3 } from 'lucide-react';

interface Character {
  name: string;
  photo: string;
  maxHealth: number;
  currentHealth: number;
  maxChakra: number;
  currentChakra: number;
  background: string;
  class: string;
  level: number;
  jutsus: Jutsu[];
}

interface Jutsu {
  id: string;
  name: string;
  chakraCost: number;
}

const CharacterSheet: React.FC = () => {
  const [character, setCharacter] = useState<Character>({
    name: '',
    photo: '',
    maxHealth: 100,
    currentHealth: 100,
    maxChakra: 50,
    currentChakra: 50,
    background: '',
    class: '',
    level: 1,
    jutsus: []
  });

  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stats' | 'jutsus'>('stats');
  const [newJutsu, setNewJutsu] = useState({ name: '', chakraCost: 0 });
  const [editingJutsu, setEditingJutsu] = useState<string | null>(null);

  useEffect(() => {
    const savedCharacter = localStorage.getItem('era-genetica-character');
    if (savedCharacter) {
      const parsed = JSON.parse(savedCharacter);
      setCharacter(prevCharacter => ({ 
        ...prevCharacter, 
        ...parsed, 
        jutsus: parsed.jutsus || [] 
      }));
      setPhotoPreview(parsed.photo);
    } else {
      setIsEditing(true);
    }
  }, []);

  const saveCharacter = () => {
    const updatedCharacter = { ...character, photo: photoPreview };
    localStorage.setItem('era-genetica-character', JSON.stringify(updatedCharacter));
    setCharacter(updatedCharacter);
    setIsEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const adjustHealth = (amount: number) => {
    setCharacter(prev => ({
      ...prev,
      currentHealth: Math.min(Math.max(0, prev.currentHealth + amount), prev.maxHealth)
    }));
  };

  const adjustChakra = (amount: number) => {
    setCharacter(prev => ({
      ...prev,
      currentChakra: Math.min(Math.max(0, prev.currentChakra + amount), prev.maxChakra)
    }));
  };

  const addJutsu = () => {
    if (newJutsu.name.trim() && newJutsu.chakraCost > 0) {
      const jutsu: Jutsu = {
        id: Date.now().toString(),
        name: newJutsu.name.trim(),
        chakraCost: newJutsu.chakraCost
      };
      setCharacter(prev => ({
        ...prev,
        jutsus: [...prev.jutsus, jutsu]
      }));
      setNewJutsu({ name: '', chakraCost: 0 });
    }
  };

  const useJutsu = (jutsu: Jutsu) => {
    if (character.currentChakra >= jutsu.chakraCost) {
      setCharacter(prev => ({
        ...prev,
        currentChakra: prev.currentChakra - jutsu.chakraCost
      }));
    }
  };

  const deleteJutsu = (jutsuId: string) => {
    setCharacter(prev => ({
      ...prev,
      jutsus: prev.jutsus.filter(jutsu => jutsu.id !== jutsuId)
    }));
  };

  const updateJutsu = (jutsuId: string, updatedJutsu: Omit<Jutsu, 'id'>) => {
    setCharacter(prev => ({
      ...prev,
      jutsus: prev.jutsus.map(jutsu => 
        jutsu.id === jutsuId 
          ? { ...jutsu, ...updatedJutsu }
          : jutsu
      )
    }));
    setEditingJutsu(null);
  };

  const getHealthPercentage = () => (character.currentHealth / character.maxHealth) * 100;
  const getChakraPercentage = () => (character.currentChakra / character.maxChakra) * 100;

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Era Genética
                </h1>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Personagem</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome do personagem..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Classe</label>
                <input
                  type="text"
                  value={character.class}
                  onChange={(e) => setCharacter(prev => ({ ...prev, class: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Geneticista, Soldado..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nível</label>
                  <input
                    type="number"
                    value={character.level}
                    onChange={(e) => setCharacter(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Vida Máxima</label>
                  <input
                    type="number"
                    value={character.maxHealth}
                    onChange={(e) => {
                      const maxHealth = parseInt(e.target.value) || 100;
                      setCharacter(prev => ({ 
                        ...prev, 
                        maxHealth,
                        currentHealth: Math.min(prev.currentHealth, maxHealth)
                      }));
                    }}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Chakra Máximo</label>
                  <input
                    type="number"
                    value={character.maxChakra}
                    onChange={(e) => {
                      const maxChakra = parseInt(e.target.value) || 50;
                      setCharacter(prev => ({ 
                        ...prev, 
                        maxChakra,
                        currentChakra: Math.min(prev.currentChakra, maxChakra)
                      }));
                    }}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">História/Background</label>
                <textarea
                  value={character.background}
                  onChange={(e) => setCharacter(prev => ({ ...prev, background: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva a história do personagem..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Foto do Personagem</label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                    />
                  </div>
                  {photoPreview && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-600">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={saveCharacter}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                <span>Salvar Personagem</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {character.photo && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/20">
                    <img src={character.photo} alt={character.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{character.name}</h1>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <span>{character.class}</span>
                    <span>•</span>
                    <span>Nível {character.level}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
              >
                Editar
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="border-b border-slate-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-4 font-semibold transition-colors duration-200 border-b-2 ${
                  activeTab === 'stats'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Status</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('jutsus')}
                className={`px-6 py-4 font-semibold transition-colors duration-200 border-b-2 ${
                  activeTab === 'jutsus'
                    ? 'text-purple-400 border-purple-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Scroll className="w-5 h-5" />
                  <span>Jutsus</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'stats' && (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Health */}
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-6 h-6 text-red-500" />
                    <h3 className="text-lg font-semibold text-white">Vida</h3>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {character.currentHealth}/{character.maxHealth}
                  </span>
                </div>
                
                <div className="w-full bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-400 h-4 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${getHealthPercentage()}%` }}
                  />
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => adjustHealth(-1)}
                    className="w-12 h-12 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => adjustHealth(-5)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 font-semibold transition-all duration-200"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => adjustHealth(5)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 font-semibold transition-all duration-200"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => adjustHealth(1)}
                    className="w-12 h-12 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Chakra */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-6 h-6 text-purple-500" />
                    <h3 className="text-lg font-semibold text-white">Chakra</h3>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {character.currentChakra}/{character.maxChakra}
                  </span>
                </div>
                
                <div className="w-full bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-4 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${getChakraPercentage()}%` }}
                  />
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => adjustChakra(-1)}
                    className="w-12 h-12 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-400 hover:text-purple-300 transition-all duration-200"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => adjustChakra(-5)}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 font-semibold transition-all duration-200"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => adjustChakra(5)}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 font-semibold transition-all duration-200"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => adjustChakra(1)}
                    className="w-12 h-12 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-400 hover:text-purple-300 transition-all duration-200"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Background */}
            {character.background && (
              <div className="mt-6 bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">História</h3>
                <p className="text-slate-300 leading-relaxed">{character.background}</p>
              </div>
            )}
              </>
            )}

            {/* Jutsus List in Stats Tab */}
            <div className="mt-6 space-y-6">
              {/* Add New Jutsu */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-purple-400" />
                  <span>Adicionar Novo Jutsu</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={newJutsu.name}
                      onChange={(e) => setNewJutsu(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do Jutsu"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={newJutsu.chakraCost || ''}
                      onChange={(e) => setNewJutsu(prev => ({ ...prev, chakraCost: parseInt(e.target.value) || 0 }))}
                      placeholder="Chakra"
                      min="1"
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={addJutsu}
                      disabled={!newJutsu.name.trim() || newJutsu.chakraCost <= 0}
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Jutsu List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Scroll className="w-5 h-5 text-purple-400" />
                  <span>Jutsus Disponíveis</span>
                  <span className="text-sm text-slate-400">({character.jutsus.length})</span>
                </h3>
                
                {character.jutsus.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Scroll className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum jutsu criado ainda</p>
                    <p className="text-sm">Adicione seu primeiro jutsu acima</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {character.jutsus.map((jutsu) => (
                      <div key={jutsu.id} className="group">
                        {editingJutsu === jutsu.id ? (
                          <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4">
                            <div className="space-y-3">
                              <input
                                type="text"
                                defaultValue={jutsu.name}
                                onBlur={(e) => {
                                  if (e.target.value.trim()) {
                                    updateJutsu(jutsu.id, { name: e.target.value.trim(), chakraCost: jutsu.chakraCost });
                                  } else {
                                    setEditingJutsu(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (e.currentTarget.value.trim()) {
                                      updateJutsu(jutsu.id, { name: e.currentTarget.value.trim(), chakraCost: jutsu.chakraCost });
                                    } else {
                                      setEditingJutsu(null);
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingJutsu(null);
                                  }
                                }}
                                autoFocus
                                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <input
                                type="number"
                                defaultValue={jutsu.chakraCost}
                                onBlur={(e) => {
                                  const chakraCost = parseInt(e.target.value) || jutsu.chakraCost;
                                  updateJutsu(jutsu.id, { name: jutsu.name, chakraCost });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const chakraCost = parseInt(e.currentTarget.value) || jutsu.chakraCost;
                                    updateJutsu(jutsu.id, { name: jutsu.name, chakraCost });
                                  } else if (e.key === 'Escape') {
                                    setEditingJutsu(null);
                                  }
                                }}
                                min="1"
                                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => useJutsu(jutsu)}
                            disabled={character.currentChakra < jutsu.chakraCost}
                            className={`w-full text-left bg-gradient-to-br from-slate-700/50 to-slate-800/30 border rounded-xl p-4 transition-all duration-200 ${
                              character.currentChakra >= jutsu.chakraCost
                                ? 'border-purple-500/30 hover:border-purple-400/50 hover:from-purple-500/10 hover:to-purple-600/5 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer'
                                : 'border-slate-600/50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white mb-1">{jutsu.name}</h4>
                                <div className="flex items-center space-x-2">
                                  <Zap className="w-4 h-4 text-purple-400" />
                                  <span className="text-sm text-purple-300">{jutsu.chakraCost} Chakra</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingJutsu(jutsu.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-400 transition-colors duration-200"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteJutsu(jutsu.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-400 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {character.currentChakra < jutsu.chakraCost && (
                              <div className="mt-2 text-xs text-red-400">
                                Chakra insuficiente
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {activeTab === 'jutsus' && (
              <div className="text-center py-12 text-slate-400">
                <Scroll className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Os jutsus agora estão na aba Status</p>
                <p className="text-sm">Embaixo da seção História</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;