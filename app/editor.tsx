import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import {
  PenTool,
  Calendar,
  Type,
  CheckSquare,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { usePdfStore, PlacedElement } from '../src/store/usePdfStore';
import { exportSignedPdf } from '../src/engine/pdfEngine';
import { FormFieldOverlay } from '../src/components/FormFieldOverlay';
import { PaywallModal } from '../src/components/PaywallModal';

type ToolType = 'signature' | 'date' | 'text' | 'check';

export default function EditorScreen() {
  const router = useRouter();
  const {
    document,
    activePageIndex,
    placedElements,
    vaultSignatures,
    isPro,
    setActivePageIndex,
    addPlacedElement,
    removePlacedElement,
    incrementSignedCount,
  } = usePdfStore();

  const [activeTool, setActiveTool] = useState<ToolType>('signature');
  const [isExporting, setIsExporting] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  if (!document) {
    router.replace('/');
    return null;
  }

  const currentPage = document.pages[activePageIndex] || {
    width: 612,
    height: 792,
  };

  const handleCanvasTap = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let content = '';
    let width = 120;
    let height = 40;

    if (activeTool === 'signature') {
      if (vaultSignatures.length > 0) {
        content = vaultSignatures[0].base64Png;
      } else {
        content = 'Signature';
      }
      width = 130;
      height = 50;
    } else if (activeTool === 'date') {
      const now = new Date();
      content = now.toISOString().split('T')[0];
      width = 90;
      height = 30;
    } else if (activeTool === 'text') {
      content = 'Approved & Signed';
      width = 140;
      height = 30;
    } else if (activeTool === 'check') {
      content = '✓';
      width = 30;
      height = 30;
    }

    const newElem: PlacedElement = {
      id: `elem_${Date.now()}`,
      pageIndex: activePageIndex,
      type: activeTool,
      x: Math.max(10, locationX - width / 2),
      y: Math.max(10, locationY - height / 2),
      width,
      height,
      content,
    };

    addPlacedElement(newElem);
  };

  const handleExport = async () => {
    if (placedElements.length === 0) {
      Alert.alert('No Signatures Placed', 'Please tap on the document to place a signature or stamp first.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsExporting(true);

      const exportedPath = await exportSignedPdf(
        document.uri,
        placedElements,
        `signed_${document.name}`
      );

      incrementSignedCount();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportedPath);
      } else {
        Alert.alert('Document Exported', `Signed PDF saved to: ${exportedPath}`);
      }
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Failed to export signed PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const pageElements = placedElements.filter((e) => e.pageIndex === activePageIndex);

  return (
    <View className="flex-1 bg-slate-950 px-4 py-2">
      {/* Top Header Controls: Page Pagination */}
      <View className="flex-row items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-white font-bold text-xs" numberOfLines={1}>
            {document.name}
          </Text>
          <Text className="text-slate-400 text-[10px]">
            Page {activePageIndex + 1} of {document.pageCount}
          </Text>
        </View>

        {document.pageCount > 1 && (
          <View className="flex-row items-center space-x-1">
            <TouchableOpacity
              onPress={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className={`p-1.5 rounded-lg mr-1 ${activePageIndex === 0 ? 'opacity-30' : 'bg-slate-800'}`}
            >
              <ChevronLeft size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setActivePageIndex(Math.min(document.pageCount - 1, activePageIndex + 1))
              }
              disabled={activePageIndex === document.pageCount - 1}
              className={`p-1.5 rounded-lg ${
                activePageIndex === document.pageCount - 1 ? 'opacity-30' : 'bg-slate-800'
              }`}
            >
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Export Button */}
        <TouchableOpacity
          onPress={handleExport}
          disabled={isExporting}
          className="bg-blue-600 px-3.5 py-1.5 rounded-xl flex-row items-center ml-2"
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Share2 size={14} color="#FFFFFF" />
              <Text className="text-white font-bold text-xs ml-1.5">Export</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Document Interactive Page Canvas */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCanvasTap}
          className="w-full aspect-[1/1.3] bg-white rounded-xl shadow-2xl relative overflow-hidden border border-slate-700"
        >
          {/* Simulated contract document lines */}
          <View className="p-6 space-y-4">
            <View className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
            <View className="h-2.5 bg-slate-200 rounded w-full" />
            <View className="h-2.5 bg-slate-200 rounded w-5/6" />
            <View className="h-2.5 bg-slate-200 rounded w-4/5" />
            <View className="h-2.5 bg-slate-200 rounded w-full" />
            <View className="h-2.5 bg-slate-200 rounded w-3/4" />

            <View className="mt-8 pt-8 border-t border-slate-300 flex-row justify-between">
              <View className="w-40 border-b border-slate-400 pb-1">
                <Text className="text-[10px] text-slate-400 uppercase font-mono">Signatory</Text>
              </View>
              <View className="w-24 border-b border-slate-400 pb-1">
                <Text className="text-[10px] text-slate-400 uppercase font-mono">Date</Text>
              </View>
            </View>
          </View>

          {/* Render Placed Stamps on this page */}
          {pageElements.map((elem) => (
            <FormFieldOverlay
              key={elem.id}
              element={elem}
              onRemove={removePlacedElement}
            />
          ))}
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tool Selector Ribbon */}
      <View className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl mt-2 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTool('signature');
          }}
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl mr-1 ${
            activeTool === 'signature' ? 'bg-blue-600' : 'bg-slate-800/60'
          }`}
        >
          <PenTool size={14} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold ml-1.5">Sign</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTool('date');
          }}
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl mx-1 ${
            activeTool === 'date' ? 'bg-blue-600' : 'bg-slate-800/60'
          }`}
        >
          <Calendar size={14} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold ml-1.5">Date</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTool('text');
          }}
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl mx-1 ${
            activeTool === 'text' ? 'bg-blue-600' : 'bg-slate-800/60'
          }`}
        >
          <Type size={14} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold ml-1.5">Text</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTool('check');
          }}
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ml-1 ${
            activeTool === 'check' ? 'bg-blue-600' : 'bg-slate-800/60'
          }`}
        >
          <CheckSquare size={14} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold ml-1.5">Check</Text>
        </TouchableOpacity>
      </View>

      {/* Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
