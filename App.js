import React, { useState, useEffect } from 'react';
import { supabase, signInAnon } from './utils/supabase';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, set } from 'lodash';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskDate, setEditTaskDate] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [actionCount, setActionCount] = useState(0);
  const [dailyAdCount, setDailyAdCount] = useState(0);
  const [lastAdDate, setLastAdDate] = useState('');


  useEffect(() => {
  const initUser = async () => {
      const session = await supabase.auth.getSession()
      
      if (!session.data.session) {
        const user = await signInAnon()
        await AsyncStorage.setItem('user_id', user.id)
        console.log('Usuário anonimo criado e ID salvo:', user.id);
      }
    }
    initUser()
    
  }, []);


  const getTasks = async () => {
    try {
      const {data: tasks, error} = await supabase.from('tasks').select();

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      if (tasks && tasks.length > 0) {
        setTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Load tasks from storage on app start
  useEffect(() => {
    getTasks();
  }, []);

  // useEffect(() => {
  // const init = async () => {
  //   initUser().then(() => {
  //     console.log('Usuário inicializado:', user.id);
  //     getTasks();
  //   });
  // };

//   init();
// }, []);

  // const loadAdData = async () => {
  //   try {
  //     const storedActionCount = await AsyncStorage.getItem('actionCount');
  //     const storedDailyAdCount = await AsyncStorage.getItem('dailyAdCount');
  //     const storedLastAdDate = await AsyncStorage.getItem('lastAdDate');
      
  //     if (storedActionCount) setActionCount(parseInt(storedActionCount));
  //     if (storedDailyAdCount) setDailyAdCount(parseInt(storedDailyAdCount));
  //     if (storedLastAdDate) setLastAdDate(storedLastAdDate);
  //   } catch (error) {
  //     console.error('Error loading ad data:', error);
  //   }
  // };

  // const saveAdData = async (newActionCount, newDailyAdCount, newLastAdDate) => {
  //   try {
  //     await AsyncStorage.setItem('actionCount', newActionCount.toString());
  //     await AsyncStorage.setItem('dailyAdCount', newDailyAdCount.toString());
  //     await AsyncStorage.setItem('lastAdDate', newLastAdDate);
  //   } catch (error) {
  //     console.error('Error saving ad data:', error);
  //   }
  // };

  // const incrementActionCount = async () => {
  //   const today = new Date().toLocaleDateString('pt-BR');
  //   let newActionCount = actionCount + 1;
  //   let newDailyAdCount = dailyAdCount;
  //   let newLastAdDate = lastAdDate;

  //   // Reset daily ad count if it's a new day
  //   if (lastAdDate !== today) {
  //     newDailyAdCount = 0;
  //     newLastAdDate = today;
  //   }

  //   // Check if we should show an ad (every 20 actions and max 3 per day)
  //   if (newActionCount % 20 === 0 && newDailyAdCount < 3) {
  //     showInterstitialAd();
  //     newDailyAdCount += 1;
  //   }

  //   setActionCount(newActionCount);
  //   setDailyAdCount(newDailyAdCount);
  //   setLastAdDate(newLastAdDate);
  //   await saveAdData(newActionCount, newDailyAdCount, newLastAdDate);
  // };

  // const showInterstitialAd = () => {
  //   // Simple ad simulation - in a real app, this would show an actual ad
  //   Alert.alert(
  //     '📱 Anúncio',
  //     'Este é um espaço para anúncio intersticial.\n\nEm uma versão de produção, aqui seria exibido um anúncio real do AdMob.',
  //     [
  //       {
  //         text: 'Fechar',
  //         style: 'default',
  //       },
  //     ]
  //   );
  // };

  const saveTask = async (task) => {

    const { error } =  await supabase.from('tasks').update(task);
    await getTasks();
  };

  const validateDate = (dateString) => {
    if (!dateString.trim()) return true; // Empty date is valid (will use today's date)
    
    // Check if date matches DD/MM/YYYY format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Check if date is valid
    const date = new Date(year, month - 1, day);

    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year 
  };

  const formatDate = (dateString) => {
    if (!dateString.trim()) return new Date().toLocaleDateString('pt-BR');
    
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) return new Date().toLocaleDateString('pt-BR');
    
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    
    return `${month}/${day}/${year}`;
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(day.dateString);
    const formattedDate = formatDateDisplay(selectedDate)
    setNewTaskDate(formattedDate);
    setShowCalendar(false);
  };

  const handleEditDateSelect = (day) => {
    const selectedDate = new Date(day.dateString);
    const formattedDate = formatDateDisplay(selectedDate)

    setEditTaskDate(formattedDate);
    
    const task = {
      ...editingTask,
      date: selectedDate.toISOString().split('T')[0]
    }

    setEditingTask(task)
    setShowEditCalendar(false);
  };

  // utils/formatDateDisplay.js
  const formatDateDisplay = (input) => {
    let day, month, year;

    if (input instanceof Date) {
      // input é Date
      [year, month, day] = input.toISOString().split('T')[0].split('-');
    } else if (typeof input === 'string') {
      // input é string "YYYY-MM-DD"
      [year, month, day] = input.split('-');
    } else {
      throw new Error('Input must be a Date or string in YYYY-MM-DD format');
    }

    return `${day}/${month}/${year}`;
  };


  const addTask = async () => {
    if (newTaskText.trim() === '') {
      Alert.alert('Erro', 'Por favor, digite uma descrição para a tarefa');
      return;
    }

    if (!validateDate(newTaskDate)) {
      Alert.alert('Erro', 'Por favor, digite uma data válida no formato DD/MM/AAAA ou deixe em branco para usar a data de hoje');
      return;
    }

    const user_id = await AsyncStorage.getItem('user_id');

    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      date: formatDate(newTaskDate),
      priority: newTaskPriority,
      completed: false,
      completedDate: null,
      user_id: user_id
    };

    const { error } =  await supabase.from('tasks').insert(newTask);

    if (error) Alert.alert('Erro', error.message)
    else {
      setShowAddTask(false);
      setNewTaskText('');
      setNewTaskDate('');
      setNewTaskPriority('medium');

      await getTasks();

      // // Increment action count for ad display
      // await incrementActionCount();
    }
  };

  const toggleTask = async (taskId) => {

    const task = tasks.find(t => t.id === taskId);

    if (!task){
      Alert.alert('Erro', 'Erro ao editar tarefa.');
    }

    let completedDate = null;

    if (!task.completedDate)
      completedDate = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('tasks').update({completedDate: completedDate}).eq('id', taskId);
    
    if (error) Alert.alert('Erro', error.message)
      else {
        getTasks();
      
        // // Increment action count for ad display
        // await incrementActionCount();
      }
  };

  const deleteTask = (taskId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta tarefa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);

            if (error) Alert.alert('Erro', error.message)
            else {
              getTasks();
            
              // // Increment action count for ad display
              // await incrementActionCount();
            }
          },
        },
      ]
    );
  };

  const editTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setEditTaskText(task.text);
      setEditTaskDate(formatDateDisplay(task.date));
      setEditTaskPriority(task.priority || 'medium');
      setShowEditTask(true);
    }
  };

  const saveEditTask = async () => {
    if (editTaskText.trim() === '') {

      Alert.alert('Erro', 'Por favor, digite uma descrição para a tarefa');
      return;
    }

    if (!validateDate(editTaskDate)) {
      Alert.alert('Erro', 'Por favor, digite uma data válida no formato DD/MM/AAAA ou deixe em branco para usar a data de hoje');
      return;
    }

    const updatedTask = {
      ...editingTask,
      text: editTaskText.trim(),
      // date: normalizeSupabaseDate(editTaskDate),
      priority: editTaskPriority
    };

    const { error } = await supabase.from('tasks').update(updatedTask).eq('id', updatedTask.id);

    if (error) Alert.alert('Erro', error.message)
    else {
      getTasks();
      setShowEditTask(false);
      setEditingTask(null);
      setEditTaskText('');
      setEditTaskDate('');
      setEditTaskPriority('medium');

      // // Increment action count for ad display
      // await incrementActionCount();
    }
  };

  const cancelEditTask = () => {
    setShowEditTask(false);
    setEditingTask(null);
    setEditTaskText('');
    setEditTaskDate('');
    setEditTaskPriority('medium');
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => !task.completedDate || (task.completedDate && normalizeSupabaseDate(task.completedDate) == today));
  };

  const getCompletedToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task.completedDate === today);
  };

  const getCurrentTasks = () => {
    const today = new Date().toISOString().split('T')[0]

    return tasks.filter(task => !task.completedDate || (task.completedDate && normalizeSupabaseDate(task.completedDate) == today))
  };

  const getCompletedTasks = () => {
    const today = new Date().toISOString().split('T')[0];

    return tasks.filter(task => task.completedDate && normalizeSupabaseDate(task.completedDate) !== today);
  };

  function normalizeSupabaseDate(dateStr) {
    // Supabase: "YYYY-DD-MM", ex: "2025-07-10"
    let year, month, day;
    if (dateStr.includes('-')){
      [year, month, day] = dateStr.split('-')
    } else if (dateStr.includes('/')){
      [year, month, day]  = dateStr.split('/')
    } else return null;

    return `${year}-${month}-${day}`; // "YYYY-MM-DD"
  }

  const getTasksByTab = () => {
    if (activeTab === 'current') {
      return getCurrentTasks();
    } else {
      return getCompletedTasks();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Orange
      case 'low':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return 'Média';
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    // // Increment action count for tab changes
    // await incrementActionCount();
  };

  const todayTasks = getTodayTasks();
  const completedToday = getCompletedToday();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />

        <Text style={styles.title}>Agile Tasks!</Text>
      </View>

      {/* Today's Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Finalizadas hoje: <Text style={styles.summaryNumbers}>{completedToday.length} / {todayTasks.length}</Text>
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => handleTabChange('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
            Tarefas Atuais
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => handleTabChange('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Concluídas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
        <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
          {getTasksByTab().map((task) => (
            <View key={task.id} style={[styles.taskItem, task.completedDate && styles.completedTaskItem]}>
              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskText, task.completedDate && styles.completedTask]}>
                    {task.text}
                  </Text>
                  <View style={styles.taskBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority || 'medium') }]}>
                      <Text style={styles.priorityBadgeText}>
                        {getPriorityLabel(task.priority || 'medium')}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.taskDate, task.completedDate && styles.completedTaskDate]}>
                  Prazo: {formatDateDisplay(task.date)} {activeTab === 'completed' && task.completedDate ? `(Conclusão: ${formatDateDisplay(task.completedDate)})` : ''}
                </Text>
              </View>
              {activeTab === 'current' ?(<View style={styles.taskActions}>
                <TouchableOpacity
                  style={[styles.actionButton, task.completed && styles.disabledActionButton]}
                  onPress={() => editTask(task.id)}
                  disabled={!!task.completedDate}
                >
                  <Ionicons 
                    name="pencil" 
                    size={20} 
                    color={task.completedDate ? "#ccc" : "#8B5CF6"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteTask(task.id)}
                  disabled={!!task.completedDate}
                >
                  <Ionicons 
                    name="trash" 
                    size={20} 
                    color={task.completedDate ? "#ccc" : "#8B5CF6"}  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleTask(task.id)}
                >
                  <Ionicons
                    name={task.completedDate ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={task.completedDate ? "#10B981" : "#8B5CF6"}
                  />
                </TouchableOpacity>
              </View>) : null}
            </View>
          ))}
        </ScrollView>

      {/* Add Task Modal */}
      {showAddTask && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Tarefa</Text>
            <TextInput
              style={styles.input}
              placeholder="Descrição da tarefa"
              value={newTaskText}
              onChangeText={setNewTaskText}
              multiline
            />
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="DD/MM/AAAA (opcional)"
                  value={newTaskDate}
                  onChangeText={setNewTaskDate}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons name="calendar" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.dateHint}>
                Deixe em branco para usar a data de hoje
              </Text>
            </View>
            
            {/* Priority Selection */}
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>Prioridade:</Text>
              <View style={styles.priorityOptions}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newTaskPriority === priority && styles.selectedPriorityOption,
                      { 
                        borderColor: newTaskPriority === priority 
                          ? getPriorityColor(priority) 
                          : '#E5E7EB' 
                      }
                    ]}
                    onPress={() => setNewTaskPriority(priority)}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                    <Text style={[
                      styles.priorityOptionText,
                      newTaskPriority === priority && styles.selectedPriorityOptionText
                    ]}>
                      {getPriorityLabel(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddTask(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={addTask}
              >
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Edit Task Modal */}
      {showEditTask && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Tarefa</Text>
            <TextInput
              style={styles.input}
              placeholder="Descrição da tarefa"
              value={editTaskText}
              onChangeText={setEditTaskText}
              multiline
            />
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="DD/MM/AAAA (opcional)"
                  value={editTaskDate}
                  onChangeText={setEditTaskDate}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowEditCalendar(true)}
                >
                  <Ionicons name="calendar" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.dateHint}>
                Deixe em branco para usar a data de hoje
              </Text>
            </View>
            
            {/* Priority Selection */}
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>Prioridade:</Text>
              <View style={styles.priorityOptions}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      editTaskPriority === priority && styles.selectedPriorityOption,
                      { 
                        borderColor: editTaskPriority === priority 
                          ? getPriorityColor(priority) 
                          : '#E5E7EB' 
                      }
                    ]}
                    onPress={() => setEditTaskPriority(priority)}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                    <Text style={[
                      styles.priorityOptionText,
                      editTaskPriority === priority && styles.selectedPriorityOptionText
                    ]}>
                      {getPriorityLabel(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={cancelEditTask}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={saveEditTask}
              >
                <Text style={styles.addButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Selecionar Data</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#8B5CF6',
                selectedDayBackgroundColor: '#8B5CF6',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#8B5CF6',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#8B5CF6',
                selectedDotColor: '#ffffff',
                arrowColor: '#8B5CF6',
                disabledArrowColor: '#d9e1e8',
                monthTextColor: '#8B5CF6',
                indicatorColor: '#8B5CF6',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13
              }}
              // maxDate={new Date().toISOString().split('T')[0]}
              enableSwipeMonths={true}
            />
          </View>
        </View>
      )}

      {/* Edit Calendar Modal */}
      {showEditCalendar && (
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Selecionar Data</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowEditCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleEditDateSelect}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#8B5CF6',
                selectedDayBackgroundColor: '#8B5CF6',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#8B5CF6',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#8B5CF6',
                selectedDotColor: '#ffffff',
                arrowColor: '#8B5CF6',
                disabledArrowColor: '#d9e1e8',
                monthTextColor: '#8B5CF6',
                indicatorColor: '#8B5CF6',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13
              }}
              // maxDate={new Date().toISOString().split('T')[0]}
              enableSwipeMonths={true}
            />
          </View>
        </View>
      )}

      {/* Floating Action Button - Only show on current tasks tab */}
      {activeTab === 'current' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddTask(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    // alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    marginRight: 12,
  },  
  logoSquare: {
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  logoSquareOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 4,
    zIndex: 1,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#000',
  },
  summaryNumbers: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  activeTabText: {
    color: '#fff',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completedTaskItem: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    opacity: 0.8,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  taskText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  completedBadge: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  taskDate: {
    fontSize: 14,
    color: '#666',
  },
  completedTaskDate: {
    color: '#9CA3AF',
  },
  disabledActionButton: {
    opacity: 0.5,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  selectedPriorityOption: {
    backgroundColor: '#F3F0FF',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  selectedPriorityOptionText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#8B5CF6',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  calendarButton: {
    padding: 12,
    backgroundColor: '#F3F0FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  dateHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  calendarCloseButton: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  addButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});