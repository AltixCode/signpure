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
  Sparkles,
} from 'lucide-react-native';
import { usePdfStore } from '../src/store/usePdfStore';
import { exportSignedPdf } from '../src/engine/pdfEngine';
import { screenToPdfCoordinates, ViewportTransform } from '../src/engine/coordinateMath';
import { PdfPageCanvas, CanvasGeometry } from '../src/components/PdfPageCanvas';
import { FormFieldOverlay } from '../src/components/FormFieldOverlay';
import { PaywallModal } from '../src/components/PaywallModal';
import { t } from '../src/i18n';
import { ForwardChevron } from '../src/components/DirectionalIcons';
import { useTheme } from '../src/theme/useTheme';

type ToolType = 'signature' | 'date' | 'text' | 'check';

export default function EditorScreen() {
  const theme = useTheme();
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
  const [geometry, setGeometry] = useState<CanvasGeometry | null>(null);
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

  const handleCanvasTap = (
    evt: GestureResponderEvent,
    geometry: CanvasGeometry,
  ) => {
    const { locationX, locationY } = evt.nativeEvent;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let content = '';
    let width = 120;
    let height = 40;

    if (activeTool === 'signature') {
      if (vaultSignatures.length > 0) {
        content = vaultSignatures[0].base64Png;
      } else {
        Alert.alert(t('noSignatureYet'), t('noSignatureYetDesc'));
        return;
      }
      width = 130;
      height = 50;
    } else if (activeTool === 'date') {
      content = new Date().toISOString().split('T')[0];
      width = 90;
      height = 30;
    } else if (activeTool === 'text') {
      content = t('signatory');
      width = 140;
      height = 30;
    } else if (activeTool === 'check') {
      content = '\u2713';
      width = 30;
      height = 30;
    }

    // Screen points are not PDF points. The canvas is rendered at whatever
    // width the device gives it, while pdf-lib writes into the page's own
    // coordinate space, so a tap has to be divided by the display ratio.
    // Storing raw locationX/locationY put a centre tap near 29% across an A4
    // page.
    const viewport: ViewportTransform = {
      scale: geometry.displayWidth / geometry.pointWidth,
      originX: 0,
      originY: 0,
      pageWidth: geometry.pointWidth,
      pageHeight: geometry.pointHeight,
    };

    const sizeInPoints = {
      width: width / viewport.scale,
      height: height / viewport.scale,
    };

    // screenToPdfCoordinates returns the bottom-left origin pdf-lib expects,
    // measured from the tap; shift by half the element so it lands centred.
    const anchor = screenToPdfCoordinates(
      locationX - width / 2,
      locationY - height / 2,
      viewport,
    );

    addPlacedElement({
      id: `elem_${Date.now()}`,
      pageIndex: activePageIndex,
      type: activeTool,
      x: Math.max(0, Math.min(anchor.x, geometry.pointWidth - sizeInPoints.width)),
      y: Math.max(0, Math.min(anchor.y - sizeInPoints.height, geometry.pointHeight - sizeInPoints.height)),
      width: sizeInPoints.width,
      height: sizeInPoints.height,
      content,
    });
  };

  const handleExport = async () => {
    if (placedElements.length === 0) {
      Alert.alert(t('noSignaturesPlaced'), t('noSignaturesPlacedDesc'));
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
        Alert.alert(t('documentExported'), t('savedTo', { path: exportedPath }));
      }
    } catch (err: any) {
      Alert.alert(t('exportError'), err?.message || t('exportErrorDesc'));
    } finally {
      setIsExporting(false);
    }
  };

  const pageElements = placedElements.filter((e) => e.pageIndex === activePageIndex);

  return (
    <View className="flex-1 px-4 py-2" style={{ backgroundColor: theme.background }}>
      {/* Top Header Controls: Page Pagination */}
      <View className="flex-row items-center justify-between border px-4 py-2.5 rounded-2xl mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
        <View className="flex-1 mr-2">
          <Text className="font-bold text-xs" style={{ color: theme.text }} numberOfLines={1}>
            {document.name}
          </Text>
          <Text className="text-[10px]" style={{ color: theme.textSecondary }}>
            {t('pageOf', { current: activePageIndex + 1, total: document.pageCount })}
          </Text>
        </View>

        {document.pageCount > 1 && (
          <View className="flex-row items-center gap-1">
            <TouchableOpacity
              onPress={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className="p-1.5 rounded-lg mr-1"
              style={{
                backgroundColor: theme.controlSurface,
                opacity: activePageIndex === 0 ? 0.3 : 1,
              }}
            >
              <ChevronLeft size={16} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setActivePageIndex(Math.min(document.pageCount - 1, activePageIndex + 1))
              }
              disabled={activePageIndex === document.pageCount - 1}
              className="p-1.5 rounded-lg"
              style={{
                backgroundColor: theme.controlSurface,
                opacity: activePageIndex === document.pageCount - 1 ? 0.3 : 1,
              }}
            >
              <ForwardChevron size={16} color={theme.text} />
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
            <ActivityIndicator size="small" color={theme.onPrimary} />
          ) : (
            <>
              <Share2 size={14} color={theme.onPrimary} />
              <Text className="font-bold text-xs ml-1.5" style={{ color: theme.onPrimary }}>{t('export')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Document Interactive Page Canvas */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <PdfPageCanvas
          uri={document.uri}
          pageIndex={activePageIndex}
          onTap={handleCanvasTap}
          onGeometry={setGeometry}
        >
          {geometry
            ? pageElements.map((elem) => (
                <FormFieldOverlay
                  key={elem.id}
                  element={elem}
                  geometry={geometry}
                  onRemove={removePlacedElement}
                />
              ))
            : null}
        </PdfPageCanvas>
      </ScrollView>

      {/* Bottom Tool Selector Ribbon */}
      <View className="border p-2.5 rounded-2xl mt-2 flex-row justify-between items-center" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTool('signature');
          }}
          className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl mr-1"
          style={{
            backgroundColor: activeTool === 'signature' ? theme.primary : theme.controlSurface,
          }}
        >
          <PenTool size={14} color={activeTool === 'signature' ? theme.onPrimary : theme.text} />
          <Text
            className="text-xs font-bold ml-1.5"
            style={{ color: activeTool === 'signature' ? theme.onPrimary : theme.text }}
          >
            {t('toolSign')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTool('date');
          }}
          className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl mx-1"
          style={{
            backgroundColor: activeTool === 'date' ? theme.primary : theme.controlSurface,
          }}
        >
          <Calendar size={14} color={activeTool === 'date' ? theme.onPrimary : theme.text} />
          <Text
            className="text-xs font-bold ml-1.5"
            style={{ color: activeTool === 'date' ? theme.onPrimary : theme.text }}
          >
            {t('toolDate')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTool('text');
          }}
          className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl mx-1"
          style={{
            backgroundColor: activeTool === 'text' ? theme.primary : theme.controlSurface,
          }}
        >
          <Type size={14} color={activeTool === 'text' ? theme.onPrimary : theme.text} />
          <Text
            className="text-xs font-bold ml-1.5"
            style={{ color: activeTool === 'text' ? theme.onPrimary : theme.text }}
          >
            {t('toolText')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTool('check');
          }}
          className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl ml-1"
          style={{
            backgroundColor: activeTool === 'check' ? theme.primary : theme.controlSurface,
          }}
        >
          <CheckSquare size={14} color={activeTool === 'check' ? theme.onPrimary : theme.text} />
          <Text
            className="text-xs font-bold ml-1.5"
            style={{ color: activeTool === 'check' ? theme.onPrimary : theme.text }}
          >
            {t('toolCheck')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
