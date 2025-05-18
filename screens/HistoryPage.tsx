import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Footer } from '../components/footer';
import { useNavigation } from '@react-navigation/native';
import { Activity, Trash2, Plus, Calendar, Droplet, Syringe, Percent, Moon, UtensilsCrossed, Briefcase, Info, ChevronRight, ChevronDown, Filter, X, Check } from 'lucide-react-native';
import { LoadingSpinner } from '../components/loading-spinner';
import { useAuth } from '../hooks/use-auth';
import { getPredictionHistory, deleteInsulinPrediction } from '../lib/api/insulin';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Swipeable } from 'react-native-gesture-handler';
import { AppHeader } from '../components/app-header';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import LinearGradient from 'react-native-linear-gradient';
import { ChatInterface } from '../components/chat-interface';

interface Event {
  id: number;
  timestamp: string;
  description: string;
  type: string;
  value?: number;
  units?: number;
  carbs?: number;
  items?: string[];
}

interface Plot {
  id: number;
  type: string;
  timeRange: string;
  label: string;
}

interface GlucoseData {
  time: string;
  glucose: number;
}

interface ApiError {
  plotId?: number;
  message: string;
}

const mockEvents: Event[] = [
  {
    id: 1,
    timestamp: '08:30',
    description: 'Pre-desayuno',
    type: 'glucose',
    value: 120,
  },
  {
    id: 2,
    timestamp: '12:30',
    description: 'Pre-almuerzo',
    type: 'insulin',
    units: 6,
  },
  {
    id: 3,
    timestamp: '13:00',
    description: 'Almuerzo',
    type: 'meal',
    carbs: 45,
    items: ['Arroz', 'Pollo', 'Ensalada'],
  },
];

const mockGlucoseData = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}:00`,
  glucose: Math.round(Math.random() * 50 + 100),
}));

const mockDailyPatternData = [
  { id: 'morning-1', value: 120, timestamp: 'morning' },
  { id: 'afternoon-1', value: 140, timestamp: 'afternoon' },
  { id: 'evening-1', value: 110, timestamp: 'evening' },
  { id: 'night-1', value: 130, timestamp: 'night' },
  { id: 'morning-2', value: 125, timestamp: 'morning' },
  { id: 'afternoon-2', value: 145, timestamp: 'afternoon' },
  { id: 'evening-2', value: 115, timestamp: 'evening' },
  { id: 'night-2', value: 135, timestamp: 'night' },
];

// --- Tab Components ---
function HistoryTab(props: any) {
  // All state and logic related to prediction history, filters, sorting, pagination, swipe-to-delete, etc.
  // Use props for any values/functions needed from parent (HistoryPage)
  // ...existing code for prediction history section, including ScrollView, filters, modals, etc...
  // Only the content inside the first section (before the statistics dashboard)
  // Replace the ScrollView and View wrapping the history section with just the content
  // ...

  // Animated scale refs for sort buttons (one per key)
  const sortKeys = ['fecha', 'cgm', 'dosis'] as const;
  type SortKey = typeof sortKeys[number];
  const animatedScales = useRef<Record<SortKey, Animated.Value>>({
    fecha: new Animated.Value(1),
    cgm: new Animated.Value(1),
    dosis: new Animated.Value(1),
  });

  return (
    <ScrollView>
      <View style={styles.content}>
        {/* HISTORIAL DE PREDICCIONES - ahora primero y fuera del Card */}
        <View style={{ marginBottom: 24 }}>
          {/* Filtros y tabla de historial, mover aquí el contenido de la sección historial */}
          <TouchableOpacity
            style={[
              styles.filterButtonSmall,
              {
                alignSelf: 'center',
                marginLeft: 0,
                shadowColor: '#388e3c',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 4,
                elevation: 4,
                borderWidth: 1.5,
                borderColor: '#388e3c',
              },
            ]}
            onPress={() => props.setFilterModalVisible(true)}
          >
            <Plus size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.filterButtonTextSmall}>Agregar filtros</Text>
          </TouchableOpacity>
          {/* Filtros activos */}
          <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginLeft:20, marginBottom:8}}>
            {(Object.entries(props.appliedFilters) as [keyof FiltersType, FilterType][]).map(([key, filter]) => {
              if (filter.value) {
                return (
                  <View key={key} style={{flexDirection:'row', alignItems:'center', backgroundColor:'#e0f2f1', borderRadius:16, paddingHorizontal:10, paddingVertical:4, marginRight:8, marginBottom:4}}>
                    <Text style={{color:'#4CAF50', fontSize:13, fontWeight:'500'}}>
                      {key === 'fecha' ? '📅' : key === 'cgm' ? '🩸' : '💉'} {filter.value}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        props.setAppliedFilters((prev: FiltersType) => ({
                          ...prev,
                          [key]: { op: '=', value: '' }
                        }));
                      }}
                      style={{marginLeft:6}}
                    >
                      <Text style={{color:'#4CAF50', fontSize:16}}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return null;
            })}
          </View>
          {/* Modal de filtros */}
          <Modal
            visible={props.filterModalVisible}
            animationType="slide"
            transparent
            onRequestClose={()=>props.setFilterModalVisible(false)}
          >
            <Pressable style={{flex:1, backgroundColor:'rgba(0,0,0,0.3)'}} onPress={()=>props.setFilterModalVisible(false)} />
            <View style={{position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24}}>
              <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                  <Filter size={24} color="#4CAF50" />
                  <Text style={{fontSize:22, fontWeight:'bold', marginLeft:8}}>Filtrar Predicciones</Text>
                </View>
                <View style={{flex: 1, alignItems: 'flex-end', justifyContent: 'center'}}>
                  <TouchableOpacity 
                    onPress={()=>props.setFilterModalVisible(false)}
                    style={{
                      backgroundColor: '#4CAF50',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      shadowColor: '#4CAF50',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                      marginTop: 2,
                    }}
                  >
                    <ChevronDown size={15} color="#fff" />
                    <Text style={{
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: '600',
                      fontFamily: 'System',
                    }}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fecha */}
              <View style={filterStyles.filterSection}>
                <View style={filterStyles.filterHeader}>
                  <Calendar size={20} color="#4CAF50" />
                  <Text style={filterStyles.filterTitle}>Fecha</Text>
                </View>
                <Text style={filterStyles.filterDescription}>Filtrar por fecha específica (formato dd/MM)</Text>
                <View style={filterStyles.inputContainer}>
                  <TextInput
                    style={filterStyles.filterInput}
                    placeholder="Ej: 16/05"
                    value={props.filters.fecha.value}
                    onChangeText={v=>props.setFilters((prev: any) => ({...prev, fecha:{...prev.fecha, value:v}}))}
                    placeholderTextColor="#bdbdbd"
                  />
                </View>
              </View>
              
              {/* CGM */}
              <View style={filterStyles.filterSection}>
                <View style={filterStyles.filterHeader}>
                  <Droplet size={20} color="#4CAF50" />
                  <Text style={filterStyles.filterTitle}>Último CGM</Text>
                </View>
                <Text style={filterStyles.filterDescription}>Filtrar por nivel de glucosa en mg/dL</Text>
                <View style={filterStyles.operatorContainer}>
                  <TouchableOpacity 
                    style={[filterStyles.operatorButton, props.filters.cgm.op === '=' && filterStyles.operatorButtonActive]} 
                    onPress={()=>props.setFilters((prev: any) => ({...prev, cgm:{...prev.cgm, op:'='}}))}
                  >
                    <Text style={[filterStyles.operatorText, props.filters.cgm.op === '=' && filterStyles.operatorTextActive]}>
                      Igual (<Text style={{fontSize: 16, fontWeight: '700'}}>=</Text>)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[filterStyles.operatorButton, props.filters.cgm.op === '>' && filterStyles.operatorButtonActive]} 
                    onPress={()=>props.setFilters((prev: any) => ({...prev, cgm:{...prev.cgm, op:'>'}}))}
                  >
                    <Text style={[filterStyles.operatorText, props.filters.cgm.op === '>' && filterStyles.operatorTextActive]}>
                      Mayor (<Text style={{fontSize: 16, fontWeight: '700'}}>{'>'}</Text>)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[filterStyles.operatorButton, props.filters.cgm.op === '<' && filterStyles.operatorButtonActive]} 
                    onPress={()=>props.setFilters((prev: any) => ({...prev, cgm:{...prev.cgm, op:'<'}}))}
                  >
                    <Text style={[filterStyles.operatorText, props.filters.cgm.op === '<' && filterStyles.operatorTextActive]}>
                      Menor (<Text style={{fontSize: 16, fontWeight: '700'}}>{'<'}</Text>)
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={filterStyles.inputContainer}>
                  <TextInput
                    style={filterStyles.filterInput}
                    placeholder="Valor en mg/dL"
                    value={props.filters.cgm.value}
                    onChangeText={v=>{
                      const validatedValue = props.validateNumericInput(v);
                      props.setFilters((prev: any) => ({...prev, cgm:{...prev.cgm, value:validatedValue}}));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#bdbdbd"
                  />
                </View>
              </View>

              {/* Dosis */}
              <View style={filterStyles.filterSection}>
                <View style={filterStyles.filterHeader}>
                  <Syringe size={20} color="#4CAF50" />
                  <Text style={filterStyles.filterTitle}>Dosis calculada</Text>
                </View>
                <Text style={filterStyles.filterDescription}>Filtrar por dosis de insulina en unidades</Text>
                <View style={filterStyles.operatorContainer}>
                  <TouchableOpacity 
                    style={[filterStyles.operatorButton, props.filters.dosis.op === '=' && filterStyles.operatorButtonActive]} 
                    onPress={()=>props.setFilters((prev: any) => ({...prev, dosis:{...prev.dosis, op:'='}}))}
                  >
                    <Text style={[filterStyles.operatorText, props.filters.dosis.op === '=' && filterStyles.operatorTextActive]}>
                      Igual (<Text style={{fontSize: 16, fontWeight: '700'}}>=</Text>)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[filterStyles.operatorButton, props.filters.dosis.op === '>' && filterStyles.operatorButtonActive]} 
                    onPress={()=>props.setFilters((prev: any) => ({...prev, dosis:{...prev.dosis, op:'>'}}))}
                  >
                    <Text style={[filterStyles.operatorText, props.filters.dosis.op === '>' && filterStyles.operatorTextActive]}>
                      Mayor (<Text style={{fontSize: 16, fontWeight: '700'}}>{'>'}</Text>)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[filterStyles.operatorButton, props.filters.dosis.op === '<' && filterStyles.operatorButtonActive]} 
                    onPress={()=>props.setFilters((prev: any) => ({...prev, dosis:{...prev.dosis, op:'<'}}))}
                  >
                    <Text style={[filterStyles.operatorText, props.filters.dosis.op === '<' && filterStyles.operatorTextActive]}>
                      Menor (<Text style={{fontSize: 16, fontWeight: '700'}}>{'<'}</Text>)
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={filterStyles.inputContainer}>
                  <TextInput
                    style={filterStyles.filterInput}
                    placeholder="Valor en unidades"
                    value={props.filters.dosis.value}
                    onChangeText={v=>{
                      const validatedValue = props.validateNumericInput(v);
                      props.setFilters((prev: any) => ({...prev, dosis:{...prev.dosis, value:validatedValue}}));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#bdbdbd"
                  />
                </View>
              </View>

              <View style={filterStyles.buttonContainer}>
                <TouchableOpacity 
                  style={filterStyles.clearButton}
                  onPress={() => {
                    props.setFilters({
                      fecha: { op: '=', value: '' },
                      cgm: { op: '=', value: '' },
                      dosis: { op: '=', value: '' },
                    });
                  }}
                >
                  <Trash2 size={18} color="#6b7280" />
                  <Text style={filterStyles.clearButtonText}>Limpiar filtros</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={filterStyles.applyButton}
                  onPress={()=>{
                    props.setAppliedFilters(props.filters);
                    props.setFilterModalVisible(false);
                  }}
                >
                  <Check size={18} color="#fff" />
                  <Text style={filterStyles.applyButtonText}>Aplicar filtros</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* ...resto de la tabla... */}
          {props.isLoadingPredictions ? (
            <LoadingSpinner text="Cargando historial..." />
          ) : props.predictionError ? (
            <Text style={{ color: '#ef4444', textAlign: 'center', margin: 16, fontSize: 18, fontFamily:'System' }}>{props.predictionError}</Text>
          ) : props.filteredSortedHistoryAdvanced.length === 0 ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', margin: 16, fontSize: 18, fontFamily:'System' }}>No hay predicciones registradas.</Text>
          ) : (
            <View style={cardStyles.predictionListContainer}>
              {/* Botones de ordenamiento */}
              <View style={cardStyles.sortHeader}>
                {[
                  { key: 'fecha', label: 'Fecha', Icon: Calendar },
                  { key: 'cgm', label: 'CGM', Icon: Droplet },
                  { key: 'dosis', label: 'Dosis', Icon: Syringe },
                ].map(option => {
                  const isActive = props.sortBy === option.key;
                  const filterActive = !!props.appliedFilters[option.key]?.value;
                  const animatedScale = animatedScales.current[option.key as SortKey];
                  const handlePress = () => {
                    Animated.sequence([
                      Animated.timing(animatedScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
                      Animated.timing(animatedScale, { toValue: 1, duration: 80, useNativeDriver: true }),
                    ]).start();
                    props.setSortBy(option.key);
                    props.setSortDir(isActive && props.sortDir === 'desc' ? 'asc' : 'desc');
                  };
                  return (
                    <Animated.View key={option.key} style={{ flex: 1, transform: [{ scale: animatedScale }] }}>
                      <TouchableOpacity
                        style={[
                          cardStyles.sortButton,
                          isActive && cardStyles.sortButtonActive,
                          isActive && { borderBottomWidth: 2, borderBottomColor: '#388e3c' },
                          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' },
                        ]}
                        onPress={handlePress}
                        activeOpacity={0.85}
                      >
                        <View style={{ marginRight: 6, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                          <option.Icon size={18} color={isActive ? '#fff' : '#4b5563'} />
                          {filterActive && (
                            <View style={cardStyles.filterDot} />
                          )}
                        </View>
                        <Text style={[
                          cardStyles.sortButtonText,
                          isActive && cardStyles.sortButtonTextActive,
                        ]}>
                          {option.label}
                        </Text>
                        {isActive && (
                          <Text style={{ marginLeft: 4, color: '#fff', fontSize: 15, fontWeight: 'bold' }}>
                            {props.sortDir === 'asc' ? '▲' : '▼'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
              {/* Lista de tarjetas de predicción */}
              {props.filteredSortedHistoryAdvanced
                .slice((props.currentPage - 1) * props.itemsPerPage, props.currentPage * props.itemsPerPage)
                .map((pred: any, idx: number) => {
                // Formatear fecha como dd/MM y hora como HH:mm
                const fecha = pred.date 
                  ? format(toZonedTime(new Date(pred.date), 'America/Argentina/Buenos_Aires'), 'dd/MM') 
                  : '-';
                const hora = pred.date 
                  ? format(toZonedTime(new Date(pred.date), 'America/Argentina/Buenos_Aires'), 'HH:mm') 
                  : '';
                const cgmPrev = Array.isArray(pred.cgmPrev) && pred.cgmPrev.length > 0 ? pred.cgmPrev[0] : '-';
                
                // Emoji para la dosis
                let dosisEmoji = '💉';
                if (pred.recommendedDose > 8) dosisEmoji = '💉💉';

                // Render right action for swipe con animación y mejoras visuales
                const renderRightActions = (_progress: unknown, dragX: Animated.AnimatedInterpolation<number>) => {
                  // Animaciones para el swipe
                  const translateX = dragX.interpolate({
                    inputRange: [-props.DELETE_WIDTH, 0],
                    outputRange: [0, props.DELETE_WIDTH * 0.6],
                    extrapolate: 'clamp',
                  });
                  const textOpacity = dragX.interpolate({
                    inputRange: [-props.DELETE_WIDTH * 0.7, -props.DELETE_WIDTH * 0.3, 0],
                    outputRange: [1, 0.5, 0],
                    extrapolate: 'clamp',
                  });
                  const iconScale = dragX.interpolate({
                    inputRange: [-props.DELETE_WIDTH, 0],
                    outputRange: [1.15, 1],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      style={[
                        swipeStyles.animatedDeleteAction,
                        {
                          width: props.DELETE_WIDTH + 30,
                          height: props.ROW_HEIGHT,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={{ flex: 1, width: '100%', height: '100%' }}
                        onPress={() => props.handleDeletePrediction(pred.id)}
                        activeOpacity={0.85}
                        accessibilityLabel="Eliminar registro"
                        accessibilityRole="button"
                      >
                        <LinearGradient
                          colors={['#ff5f6d', '#ef4444', '#b71c1c']}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={{
                            flex: 1,
                            borderTopRightRadius: 12,
                            borderBottomRightRadius: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#ef4444',
                            shadowOffset: { width: 2, height: 0 },
                            shadowOpacity: 0.18,
                            shadowRadius: 4,
                            elevation: 4,
                          }}
                        >
                          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                            <Trash2 size={28} color="#fff" />
                          </Animated.View>
                          <Animated.Text
                            style={{
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: 16,
                              marginTop: 6,
                              opacity: textOpacity,
                              transform: [{ translateX }],
                              letterSpacing: 0.5,
                              textShadowColor: '#b71c1c',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 2,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="clip"
                          >
                            Eliminar predicción
                          </Animated.Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                };

                // Mostrar spinner de loading si se está eliminando esta predicción
                if (props.isDeleting === pred.id) {
                  return (
                    <View key={idx} style={{ position: 'relative', height: props.ROW_HEIGHT, marginBottom: 10, justifyContent: 'center', alignItems: 'center' }}>
                      <LoadingSpinner text="Eliminando..." size="small" />
                    </View>
                  );
                }

                return (
                  <View key={idx} style={{ position: 'relative', height: props.ROW_HEIGHT, marginBottom: 10 }}>
                    {/* Botón eliminar sobresaliente detrás del registro */}
                    <View
                      style={[
                        swipeStyles.fabDeleteBehind,
                        // Si el swipe está abierto, ocultar el botón flotante
                        props.openSwipeable === pred.id && { opacity: 0, zIndex: -1 },
                      ]}
                      pointerEvents="box-none"
                    >
                      <TouchableOpacity
                        style={swipeStyles.fabDeleteInner}
                        onPress={() => {
                          // Abrir swipe programáticamente
                          if (props.swipeableRefs.current[pred.id]) {
                            props.swipeableRefs.current[pred.id].openRight();
                          }
                        }}
                        activeOpacity={0.85}
                        accessibilityLabel="Mostrar acción eliminar"
                        accessibilityRole="button"
                      >
                        <Trash2 size={22} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <Swipeable
                      ref={ref => { if (ref) props.swipeableRefs.current[pred.id] = ref; else delete props.swipeableRefs.current[pred.id]; }}
                      renderRightActions={renderRightActions}
                      overshootRight={false}
                      onSwipeableOpen={() => {
                        Object.keys(props.swipeableRefs.current).forEach((id: string) => {
                          if (id !== pred.id && props.swipeableRefs.current[id]) {
                            props.swipeableRefs.current[id].close();
                          }
                        });
                        props.setOpenSwipeable(pred.id);
                      }}
                      onSwipeableClose={() => {
                        if (props.openSwipeable === pred.id) props.setOpenSwipeable(null);
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          cardStyles.predictionCard,
                          { paddingRight: 0, height: props.ROW_HEIGHT, minHeight: props.ROW_HEIGHT, justifyContent: 'center', overflow: 'hidden' },
                        ]}
                        onPress={() => (props.navigation as any).navigate('PredictionResultPage', { result: pred })}
                      >
                        {/* Fila de títulos alineados */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                          <View style={[cardStyles.dataColumn, { flex: 1, minWidth: 0 }]}> {/* minWidth:0 para truncar */}
                            <Text style={cardStyles.dataLabel} numberOfLines={1} ellipsizeMode="tail">📅 Fecha</Text>
                          </View>
                          <View style={[cardStyles.dataColumn, { flex: 1, minWidth: 0 }]}> 
                            <Text style={cardStyles.dataLabel} numberOfLines={1} ellipsizeMode="tail">🩸 Último CGM</Text>
                          </View>
                          <View style={[cardStyles.dataColumn, { flex: 1, minWidth: 0 }]}> 
                            <Text style={cardStyles.dataLabel} numberOfLines={1} ellipsizeMode="tail">{dosisEmoji + ' Dosis calculada'}</Text>
                          </View>
                        </View>
                        {/* Fila de valores alineados */}
                        <View style={cardStyles.predictionContent}>
                          <View style={[cardStyles.dataColumn, { flex: 1, minWidth: 0 }]}> 
                            <Text style={[cardStyles.dataValue]} numberOfLines={1} ellipsizeMode="tail">{fecha} {hora}</Text>
                          </View>
                          <View style={[cardStyles.dataColumn, { flex: 1, minWidth: 0 }]}> 
                            <Text style={cardStyles.dataValue} numberOfLines={1} ellipsizeMode="tail">{cgmPrev} mg/dL</Text>
                          </View>
                          <View style={[cardStyles.dataColumn, { flex: 1, minWidth: 0 }]}> 
                            <Text style={cardStyles.dataValue} numberOfLines={1} ellipsizeMode="tail">{pred.recommendedDose} U</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Swipeable>
                  </View>
                );
              })}
              
              {/* Controles de paginación */}
              {props.filteredSortedHistoryAdvanced.length > 0 && (
                <View style={cardStyles.paginationContainer}>
                  <Text style={cardStyles.paginationInfo}>
                    Página {props.currentPage} de {Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage)}
                  </Text>
                  <View style={cardStyles.paginationControls}>
                    <TouchableOpacity 
                      style={[
                        cardStyles.paginationButton,
                        props.currentPage === 1 && cardStyles.paginationButtonDisabled
                      ]}
                      onPress={() => props.setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                      disabled={props.currentPage === 1}
                    >
                      <Text style={[
                        cardStyles.paginationButtonText,
                        props.currentPage === 1 && cardStyles.paginationButtonTextDisabled
                      ]}>Anterior</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        cardStyles.paginationButton,
                        props.currentPage >= Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage) && cardStyles.paginationButtonDisabled
                      ]}
                      onPress={() => props.setCurrentPage((prev: number) => Math.min(Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage), prev + 1))}
                      disabled={props.currentPage >= Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage)}
                    >
                      <Text style={[
                        cardStyles.paginationButtonText,
                        props.currentPage >= Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage) && cardStyles.paginationButtonTextDisabled
                      ]}>Siguiente</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function StatsTab(props: any) {
  // Estado para la carta girada
  const [flippedStat, setFlippedStat] = React.useState<null | string>(null);
  // Animaciones de flip para cada stat
  const flipAnimations = React.useRef<{ [key: string]: Animated.Value }>({});
  const statDetails: Record<string, string> = {
    avgCGM: 'Promedio de glucosa al aplicar dosis calculada en mg/dL.',
    avgApplyVsRecPercent: 'Porcentaje promedio de variación entre la dosis aplicada y la recomendada.',
    avgRecDose: 'Promedio de dosis recomendada por el sistema (U).',
    avgApplyDose: 'Promedio de dosis realmente aplicada (U).',
    avgSleep: 'Nivel promedio de sueño reportado por el usuario.',
    avgCarbs: 'Cantidad promedio de carbohidratos ingeridos (g).',
    avgActivity: 'Nivel promedio de actividad física.',
    avgWork: 'Nivel promedio de trabajo/estrés.',
  };
  const statIcons: Record<string, React.ReactNode> = {
    avgCGM: <Droplet color="#4CAF50" size={22} />,
    avgApplyVsRecPercent: <Percent color="#2196F3" size={22} />,
    avgRecDose: <Syringe color="#43a047" size={22} />,
    avgApplyDose: <Syringe color="#ef4444" size={22} />,
    avgSleep: <Moon color="#7e57c2" size={22} />,
    avgCarbs: <UtensilsCrossed color="#ff9800" size={22} />,
    avgActivity: <Activity color="#00bcd4" size={22} />,
    avgWork: <Briefcase color="#607d8b" size={22} />,
  };

  // Inicializar animaciones de flip
  Object.keys(statIcons).forEach(key => {
    if (!flipAnimations.current[key]) {
      flipAnimations.current[key] = new Animated.Value(0);
    }
  });

  // Manejar flip
  const handleFlip = (key: string) => {
    if (flippedStat === key) {
      Animated.timing(flipAnimations.current[key], {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setFlippedStat(null));
    } else {
      if (flippedStat && flipAnimations.current[flippedStat]) {
        Animated.timing(flipAnimations.current[flippedStat], {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start();
      }
      setFlippedStat(key);
      Animated.timing(flipAnimations.current[key], {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleAskAI = (statKey: string) => {
    const stat = statList.find(s => s.key === statKey);
    if (stat) {
      setInitialMessage(`¿Podrías explicarme más sobre mi ${stat.label.toLowerCase()} (${stat.value}) y cómo interpretarlo?`);
      setIsChatOpen(true);
    }
  };

  const statList = [
    {
      key: 'avgCGM',
      label: 'Glucosa promedio',
      value: props.stats ? props.stats.avgCGM.toFixed(1) + ' mg/dL' : '-',
      color: '#4CAF50',
    },
    {
      key: 'avgApplyVsRecPercent',
      label: 'Dosis aplicada vs rec. (%)',
      value: props.stats && props.stats.avgApplyVsRecPercent !== null ? props.stats.avgApplyVsRecPercent.toFixed(1) + ' %' : '-',
      color: '#2196F3',
    },
    {
      key: 'avgRecDose',
      label: 'Dosis recomendada',
      value: props.stats ? props.stats.avgRecDose.toFixed(2) + ' U' : '-',
      color: '#43a047',
    },
    {
      key: 'avgApplyDose',
      label: 'Dosis aplicada',
      value: props.stats && props.stats.avgApplyDose !== null ? props.stats.avgApplyDose.toFixed(2) + ' U' : '-',
      color: '#ef4444',
    },
    {
      key: 'avgSleep',
      label: 'Nivel de sueño',
      value: props.stats ? props.stats.avgSleep.toFixed(2) : '-',
      color: '#7e57c2',
    },
    {
      key: 'avgCarbs',
      label: 'Carbohidratos',
      value: props.stats ? props.stats.avgCarbs.toFixed(1) + ' g' : '-',
      color: '#ff9800',
    },
    {
      key: 'avgActivity',
      label: 'Actividad física',
      value: props.stats ? props.stats.avgActivity.toFixed(2) : '-',
      color: '#00bcd4',
    },
    {
      key: 'avgWork',
      label: 'Nivel de trabajo',
      value: props.stats ? props.stats.avgWork.toFixed(2) : '-',
      color: '#607d8b',
    },
  ];

  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleInfo = () => {
    setIsInfoExpanded(!isInfoExpanded);
    Animated.timing(animatedHeight, {
      toValue: isInfoExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Estado para la carta girada
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const { token } = useAuth();

  return (
    <ScrollView>
      <View style={styles.content}>
        {/* Combined Info Button and Content */}
        <Card style={styles.infoCard}>
          <TouchableOpacity 
            style={styles.infoButtonContent} 
            onPress={toggleInfo}
            activeOpacity={0.7}
          >
            <View style={styles.infoHeader}>
              <Info size={20} color="#4CAF50" />
              <Text style={styles.infoButtonText}>Información sobre estadísticas</Text>
            </View>
            <Animated.View style={{
              transform: [{
                rotate: animatedHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg']
                })
              }]
            }}>
              <ChevronDown size={20} color="#4CAF50" />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View style={[
            styles.infoContent,
            {
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200]
              }),
              opacity: animatedHeight
            }
          ]}>
            <View style={styles.infoDivider} />
            <Text style={styles.infoDescription}>
              Aquí podés ver un resumen de tus datos más importantes. Tocá cualquier tarjeta para ver más detalles o consultá con nuestro asistente AI para obtener análisis personalizados.
            </Text>
          </Animated.View>
        </Card>

        <Card style={styles.statsCard}>
          <CardContent>
            {props.stats ? (
              <View style={dashboardStyles.statsGridNewSmall}>
                {statList.map(stat => {
                  const rotateY = flipAnimations.current[stat.key].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  });
                  const rotateYBack = flipAnimations.current[stat.key].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['180deg', '360deg'],
                  });
                  return (
                    <View key={stat.key} style={{ flexBasis: '46%', marginBottom: 10, alignItems: 'center', minHeight: 90 }}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleFlip(stat.key)}
                        style={{ width: '100%' }}
                      >
                        <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          {/* Cara frontal */}
                          <Animated.View
                            style={[
                              dashboardStyles.statBoxNewSmall,
                              { borderColor: stat.color, shadowColor: stat.color, zIndex: flippedStat === stat.key ? 0 : 2 },
                              {
                                transform: [
                                  { perspective: 800 },
                                  { rotateY },
                                ],
                                position: flippedStat === stat.key ? 'absolute' : 'relative',
                                backfaceVisibility: 'hidden',
                              },
                            ]}
                          >
                            <View style={dashboardStyles.statIconCircleSmall}>
                              <Text>{statIcons[stat.key]}</Text>
                            </View>
                            <Text style={dashboardStyles.statLabelNewSmall}>{stat.label}</Text>
                            <Text style={[dashboardStyles.statValueNewSmall, { color: stat.color }]}>{stat.value}</Text>
                          </Animated.View>
                          {/* Cara trasera */}
                          <Animated.View
                            style={[
                              dashboardStyles.statBoxNewSmall,
                              dashboardStyles.statBoxBack,
                              { borderColor: stat.color, shadowColor: stat.color, zIndex: flippedStat === stat.key ? 2 : 0 },
                              {
                                transform: [
                                  { perspective: 800 },
                                  { rotateY: rotateYBack },
                                ],
                                position: flippedStat === stat.key ? 'relative' : 'absolute',
                                backfaceVisibility: 'hidden',
                              },
                            ]}
                          >
                            <Text style={dashboardStyles.statLabelNewSmall}>{stat.label}</Text>
                            <Text style={dashboardStyles.statDescSmall}>{statDetails[stat.key]}</Text>
                            <View style={styles.statActions}>
                              <TouchableOpacity
                                style={styles.flipBackBtn}
                                onPress={() => handleFlip(stat.key)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.flipBackText}>Volver</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.askAIButton}
                                onPress={() => handleAskAI(stat.key)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.askAIText}>Consultar AI</Text>
                              </TouchableOpacity>
                            </View>
                          </Animated.View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={dashboardStyles.noStatsText}>No hay datos suficientes para mostrar estadísticas.</Text>
            )}
          </CardContent>
        </Card>
      </View>
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        token={token}
        initialMessage={initialMessage}
      />
    </ScrollView>
  );
}

const Tab = createMaterialTopTabNavigator();

export default function HistoryPage() {
  const navigation = useNavigation();
  const { token, isAuthenticated, user } = useAuth();
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [predictionToDelete, setPredictionToDelete] = useState<string | null>(null);

  // Estado para filtros y orden
  const [sortBy, setSortBy] = useState<'fecha' | 'cgm' | 'dosis'>('fecha');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtros avanzados con operador
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    fecha: { op: '=', value: '' },
    cgm: { op: '=', value: '' },
    dosis: { op: '=', value: '' },
  });
  const [appliedFilters, setAppliedFilters] = useState({
    fecha: { op: '=', value: '' },
    cgm: { op: '=', value: '' },
    dosis: { op: '=', value: '' },
  });

  // Función de validación para campos numéricos
  const validateNumericInput = (value: string): string => {
    // Eliminar caracteres no válidos
    const cleaned = value.replace(/[^0-9.,]/g, '');
    
    // Si está vacío, devolver vacío
    if (!cleaned) return '';
    
    // Convertir comas a puntos para manejar un formato consistente
    const normalized = cleaned.replace(',', '.');
    
    // Limitar a 5 caracteres en total
    if (normalized.length > 5) return normalized.slice(0, 5);
    
    // Validar formato de número con máximo 2 decimales
    const regex = /^\d{1,3}(\.\d{0,2})?$/;
    if (!regex.test(normalized)) {
      // Si no cumple con el formato, intentar arreglarlo
      const parts = normalized.split('.');
      if (parts.length === 1) return parts[0].slice(0, 3); // Solo enteros, máximo 3 dígitos
      return parts[0].slice(0, 3) + '.' + parts[1].slice(0, 2); // Enteros + decimales
    }
    
    return normalized;
  };
  
  // --- Estadísticas ---
  const stats = React.useMemo(() => {
    if (!predictionHistory || predictionHistory.length === 0) return null;
    const count = predictionHistory.length;
    let sumCGM = 0, sumCarbs = 0, sumSleep = 0, sumWork = 0, sumActivity = 0, sumRecDose = 0, sumApplyDose = 0, countApply = 0;
    let sumRecDoseWithApply = 0, sumApplyDoseWithApply = 0, countWithApply = 0;
    let sumApplyVsRecPercent = 0, countApplyVsRecPercent = 0;
    predictionHistory.forEach(pred => {
      if (Array.isArray(pred.cgmPrev) && pred.cgmPrev.length > 0) sumCGM += Number(pred.cgmPrev[0] || 0);
      else sumCGM += 0;
      sumCarbs += Number(pred.carbs || 0);
      sumSleep += Number(pred.sleepLevel || 0);
      sumWork += Number(pred.workLevel || 0);
      sumActivity += Number(pred.activityLevel || 0);
      sumRecDose += Number(pred.recommendedDose || 0);
      if (typeof pred.applyDose === 'number' && typeof pred.recommendedDose === 'number' && pred.recommendedDose !== 0) {
        sumApplyDose += pred.applyDose;
        countApply++;
        sumRecDoseWithApply += Number(pred.recommendedDose || 0);
        sumApplyDoseWithApply += pred.applyDose;
        countWithApply++;
        // Calcular variación porcentual absoluta
        const percentDiff = Math.abs((pred.applyDose - pred.recommendedDose) / pred.recommendedDose) * 100;
        sumApplyVsRecPercent += percentDiff;
        countApplyVsRecPercent++;
      }
    });
    return {
      avgCGM: sumCGM / count,
      avgCarbs: sumCarbs / count,
      avgSleep: sumSleep / count,
      avgWork: sumWork / count,
      avgActivity: sumActivity / count,
      avgRecDose: sumRecDose / count,
      avgApplyDose: countApply > 0 ? sumApplyDose / countApply : null,
      avgRecDoseWithApply: countWithApply > 0 ? sumRecDoseWithApply / countWithApply : null,
      avgApplyDoseWithApply: countWithApply > 0 ? sumApplyDoseWithApply / countApply : null,
      avgApplyVsRecPercent: countApplyVsRecPercent > 0 ? sumApplyVsRecPercent / countApplyVsRecPercent : null,
      count,
      countWithApply,
    };
  }, [predictionHistory]);

  // --- Fetch de historial de predicciones ---
  const fetchPredictionHistoryData = async () => {
    if (!token || !user?.id) return;
    setIsLoadingPredictions(true);
    setPredictionError(null);
    try {
      const data = await getPredictionHistory(token, user.id);
      setPredictionHistory(
        data
          .slice()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    } catch (err) {
      setPredictionError('Error al cargar el historial de predicciones');
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchPredictionHistoryData();
    }
  }, [token, isAuthenticated]);

  // Resetear a la primera página cuando cambian los filtros o el ordenamiento
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, sortBy, sortDir]);

  // Filtrado y ordenado avanzado
  const filteredSortedHistoryAdvanced = predictionHistory
    .filter(pred => {
      // Fecha
      const fecha = pred.date ? format(toZonedTime(new Date(pred.date), 'America/Argentina/Buenos_Aires'), 'dd/MM') : '-';
      const cgm = pred.cgmPrev && pred.cgmPrev.length > 0 ? pred.cgmPrev[0] : '';
      const dosis = pred.recommendedDose ?? '';
      
      // Fecha solo soporta igual
      let fechaOk = true;
      if (appliedFilters.fecha.value) {
        fechaOk = fecha.includes(appliedFilters.fecha.value);
      }
      
      // CGM
      let cgmOk = true;
      if (appliedFilters.cgm.value !== '') {
        const v = Number(appliedFilters.cgm.value);
        if (appliedFilters.cgm.op === '=') cgmOk = Number(cgm) === v;
        if (appliedFilters.cgm.op === '>') cgmOk = Number(cgm) > v;
        if (appliedFilters.cgm.op === '<') cgmOk = Number(cgm) < v;
      }
      
      // Dosis
      let dosisOk = true;
      if (appliedFilters.dosis.value !== '') {
        const v = Number(appliedFilters.dosis.value);
        if (appliedFilters.dosis.op === '=') dosisOk = Number(dosis) === v;
        if (appliedFilters.dosis.op === '>') dosisOk = Number(dosis) > v;
        if (appliedFilters.dosis.op === '<') dosisOk = Number(dosis) < v;
      }
      
      return fechaOk && cgmOk && dosisOk;
    })
    .sort((a, b) => {
      let vA, vB;
      if (sortBy === 'fecha') {
        vA = new Date(a.date).getTime();
        vB = new Date(b.date).getTime();
      } else if (sortBy === 'cgm') {
        vA = a.cgmPrev && a.cgmPrev.length > 0 ? a.cgmPrev[0] : 0;
        vB = b.cgmPrev && b.cgmPrev.length > 0 ? b.cgmPrev[0] : 0;
      } else {
        vA = a.recommendedDose ?? 0;
        vB = b.recommendedDose ?? 0;
      }
      if (vA === vB) return 0;
      return sortDir === 'asc' ? vA - vB : vB - vA;
    });

  // Function to handle prediction deletion
  const handleDeletePrediction = async (id: string) => {
    if (!token || !isAuthenticated) return;
    
    setPredictionToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Function to confirm and process deletion
  const confirmDeletePrediction = async () => {
    if (!predictionToDelete || !token) return;
    
    setIsDeleting(predictionToDelete);
    setDeleteError(null);
    setShowDeleteConfirm(false);
    
    try {
      await deleteInsulinPrediction(predictionToDelete, token);
      // Remove the deleted item from state
      setPredictionHistory(prev => prev.filter(p => p.id !== predictionToDelete));
    } catch (error) {
      console.error('Error deleting prediction:', error);
      setDeleteError('Error al eliminar la predicción. Intenta de nuevo.');
    } finally {
      setIsDeleting(null);
      setPredictionToDelete(null);
    }
  };

  // Function to cancel deletion
  const cancelDeletePrediction = () => {
    setShowDeleteConfirm(false);
    setPredictionToDelete(null);
  };
  
  // Estado para swipe activo
  const [openSwipeable, setOpenSwipeable] = useState(null);
  const swipeableRefs = useRef<Record<string, any>>({});

  const ROW_HEIGHT = 74; // Ajusta este valor según el alto real de la fila
  const DELETE_WIDTH = 110; // Ancho fijo para el botón eliminar

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Historial"
        icon={<Activity width={32} height={32} color="#fff" />}
        onBack={() => navigation.goBack()}
      />
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: {
              fontWeight: 'bold',
              fontSize: 17,
              textTransform: 'none',
              fontFamily: 'System',
            },
            tabBarActiveTintColor: '#4CAF50',
            tabBarInactiveTintColor: '#6b7280',
            tabBarIndicatorStyle: {
              backgroundColor: '#4CAF50',
              height: 3,
              borderRadius: 2,
            },
            tabBarStyle: {
              backgroundColor: '#fff',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
            },
            tabBarPressColor: '#e0f2f1',
          }}
        >
          <Tab.Screen
            name="Predicciones"
            options={{ tabBarLabel: 'Predicciones' }}
          >
            {() => (
              <HistoryTab
                // Pass all necessary props/state/functions
                // e.g. predictionHistory, filters, handlers, etc.
                {...{
                  predictionHistory,
                  isLoadingPredictions,
                  predictionError,
                  isDeleting,
                  deleteError,
                  showDeleteConfirm,
                  predictionToDelete,
                  sortBy,
                  setSortBy,
                  sortDir,
                  setSortDir,
                  currentPage,
                  setCurrentPage,
                  itemsPerPage,
                  filterModalVisible,
                  setFilterModalVisible,
                  filters,
                  setFilters,
                  appliedFilters,
                  setAppliedFilters,
                  validateNumericInput,
                  fetchPredictionHistoryData,
                  handleDeletePrediction,
                  confirmDeletePrediction,
                  cancelDeletePrediction,
                  openSwipeable,
                  setOpenSwipeable,
                  swipeableRefs,
                  ROW_HEIGHT,
                  DELETE_WIDTH,
                  navigation,
                  filteredSortedHistoryAdvanced,
                  // ...any other needed props
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Estadísticas"
            options={{ tabBarLabel: 'Estadísticas' }}
          >
            {() => (
              <StatsTab
                stats={stats}
                dashboardStyles={dashboardStyles}
                navigation={navigation}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
      <Footer />
      
      {/* Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeletePrediction}
      >
        <View style={deleteStyles.modalOverlay}>
          <View style={deleteStyles.modalContent}>
            <Text style={deleteStyles.modalTitle}>Confirmar eliminación</Text>
            <Text style={deleteStyles.modalText}>
              ¿Estás seguro que deseas eliminar este registro?{'\n'}
              Esta acción no se puede deshacer.
            </Text>
            <View style={deleteStyles.buttonContainer}>
              <TouchableOpacity 
                style={[deleteStyles.button, deleteStyles.cancelButton]}
                onPress={cancelDeletePrediction}
              >
                <Text style={deleteStyles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[deleteStyles.button, deleteStyles.deleteButton]}
                onPress={confirmDeletePrediction}
              >
                <Text style={deleteStyles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const tableStyles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#e0f2f1',
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  filterInput: {
    flex: 1,
    fontSize: 18,
    backgroundColor: '#fff',
    marginHorizontal: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#222',
    borderWidth: 1,
    borderColor: '#b2dfdb',
    minWidth: 120,
  },
  headerRowSmall: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderBottomWidth: 2,
    borderBottomColor: '#388e3c',
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  thTouchSmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2, // Menos margen horizontal
  },
  thSmall: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: 18,
  },
  rowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 2,
  },
  rowEvenSmall: {
    backgroundColor: '#f9fbe7',
  },
  rowOddSmall: {
    backgroundColor: '#e0f7fa',
  },
  tdSmall: {
    flex: 1,
    color: '#222',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 6,
    fontFamily: 'System',
  },
  tableContainer: {
    minWidth: 420,
    maxWidth: 600,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#b2dfdb',
    marginVertical: 8,
    marginLeft: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5', // --background-light
  },
  content: {
    padding: 16,
    paddingBottom: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50', // --apple-green
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280', // --text-secondary
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  plotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333', // --text-primary
    marginBottom: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#EF4444', // Red for remove
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333', // --text-primary
    marginLeft: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  filterButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  filterButtonSmall: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  filterButtonTextSmall: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'System',
  },
  fontTitle: {
    fontFamily: 'System',
    fontWeight: 'bold',
    color: '#111827',
  },
  endSpacer: {
    height: 0, // Reducido a 0 para eliminar espacio adicional
    marginTop: 0,
    marginBottom: 0, // Sin margen inferior
  },
  // Estilos para el modal de eliminación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  infoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b5e20',
    marginLeft: 8,
    fontFamily: 'System',
  },
  infoContent: {
    overflow: 'hidden',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    marginHorizontal: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    fontFamily: 'System',
    padding: 12,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  flipBackBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 16,
    width: '80%',
  },
  flipBackText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  askAIButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 16,
    width: '80%',
  },
  askAIText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
});

// Tipar funciones de filtro
function filterOpBtnStyle(selected: string, op: string) {
  return {
    backgroundColor: selected === op ? '#26a69a' : '#e0f2f1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: selected === op ? 2 : 1,
    borderColor: selected === op ? '#009688' : '#b2dfdb',
  };
}

// Define tipos para fontWeight
type FontWeightType = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

function filterOpTextStyle(selected: string, op: string) {
  return {
    color: selected === op ? '#fff' : '#00796b',
    fontWeight: 'bold' as FontWeightType,
    fontSize: 18,
  };
}

// Tipos para filtros
const filterKeys = ['fecha', 'cgm', 'dosis'] as const;
type FilterKey = typeof filterKeys[number];

// Nuevos estilos para las cards de predicciones
const cardStyles = StyleSheet.create({
  predictionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'System',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'System',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'System',
    paddingVertical: 2,
  },
  timeValue: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'System',
  },
  predictionListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  sortButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#e8f5e9',
    margin: 2,
    borderRadius: 8,
  },
  sortButtonActive: {
    backgroundColor: '#4CAF50',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: 'System',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  sortIcon: {
    marginLeft: 4,
  },
  paginationContainer: {
    marginTop: 12,
    marginBottom: 4,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontFamily: 'System',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  paginationButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'System',
  },
  paginationButtonTextDisabled: {
    color: '#a0a0a0',
  },
  totalPredictions: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'System',
  },
  totalPredictionsSmall: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'right',
    fontFamily: 'System',
    fontWeight: '400',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 8,
  },
  actionButton: {
    position: 'absolute',
    bottom: 8,
    left: 12,  // Cambiado de right a left
    padding: 6,
    borderRadius: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButtonRow: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingLeft: 6,
  },
  filterIconCircle: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 2,
  },
  dataColumn: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  dataLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'System',
    textAlign: 'center',
    fontWeight: '700',
  },
  predictionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

// Estilos para swipe action
const swipeStyles = StyleSheet.create({
  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'transparent',
  },
  deleteActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
    letterSpacing: 0.5,
    textShadowColor: '#b71c1c',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  animatedDeleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 12, // Redondear también el lado izquierdo
    borderBottomLeftRadius: 12, // Redondear también el lado izquierdo
    overflow: 'hidden',
    flex: 1,
  },
  cornerIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    zIndex: 10,
  },
  fabDeleteButton: {
    position: 'absolute',
    right: -18,
    top: 18,
    zIndex: 20,
    backgroundColor: '#ef4444',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabDeleteInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabDeleteBehind: {
    position: 'absolute',
    right: -18,
    top: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: '#ef4444',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

// Estilos para el modal de eliminación
const deleteStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// Estilos para el dashboard de estadísticas
const dashboardStyles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 12,
    marginTop: 10,
  },
  noStatsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'System',
    marginVertical: 24,
  },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
  },
  // --- NUEVOS ESTILOS PARA LA NUEVA SECCIÓN DE ESTADÍSTICAS ---
  statsGridNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 8,
    gap: 8,
    marginTop: 10,
  },
  statBoxNew: {
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 110,
  },
  statIconCircle: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabelNew: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '500',
  },
  statValueNew: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'System',
    marginTop: 2,
  },
  // Tooltip/modal
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  tooltipModal: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipDesc: {
    fontSize: 15,
    color: '#555',
    marginBottom: 18,
    textAlign: 'center',
  },
  tooltipCloseBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  tooltipCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // --- NUEVOS ESTILOS PARA LA VERSIÓN PEQUEÑA Y FLIP ---
  statsGridNewSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 4,
    gap: 4,
    marginTop: 22,
  },
  statBoxNewSmall: {
    backgroundColor: '#f4f4f5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#e0e0e0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 70,
    width: '98%',
    marginHorizontal: '1%',
  },
  statIconCircleSmall: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  statLabelNewSmall: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 1,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '700',
  },
  statValueNewSmall: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'System',
    marginTop: 1,
  },
  statDescSmall: {
    fontSize: 12,
    color: '#555',
    marginVertical: 4,
    textAlign: 'center',
    fontFamily: 'System',
    minHeight: 32,
  },
  statBoxBack: {
    backgroundColor: '#e8f5e9',
    borderStyle: 'dashed',
  },
  flipBackBtn: {
    marginTop: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  flipBackText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
});

type FilterType = {
  op: string;
  value: string;
};

type FiltersType = {
  fecha: FilterType;
  cgm: FilterType;
  dosis: FilterType;
};

// Add these new styles at the end of the StyleSheet.create section
const filterStyles = StyleSheet.create({
  filterSection: {
    marginBottom: 24,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  filterDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontFamily: 'System',
  },
  operatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  operatorButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#388e3c',
  },
  operatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  operatorSymbol: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 2,
  },
  operatorTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginTop: 4,
  },
  filterInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'System',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  clearButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'System',
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'System',
  },
});