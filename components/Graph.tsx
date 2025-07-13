import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface GraphProps {
  title: string;
  labels: string[];
  data: number[];
}

const Graph: React.FC<GraphProps> = ({ title, labels, data }) => {
  const { width } = useWindowDimensions();

  // Ensure the chart has enough width to fit all labels nicely
  const chartWidth = Math.max(width * 1.2, labels.length * 20);

  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    visible: boolean;
    value: number;
    label: string;
  }>({ x: 0, y: 0, visible: false, value: 0, label: '' });

  return (
    <View style={[styles.cardContainer, { width: width - 32 }]}>
      <View style={styles.header}>
        <View style={styles.accentBar} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data,
                strokeWidth: 2,
              },
            ],
          }}
          width={chartWidth}
          height={240}
          yAxisLabel="₹"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: {
              r: '3',
              strokeWidth: '2',
              stroke: '#007bff',
              fill: '#007bff',
            },
          }}
          bezier
          onDataPointClick={(dataPoint) => {
            const isSamePoint =
              tooltipPos.x === dataPoint.x && tooltipPos.y === dataPoint.y;

            isSamePoint
              ? setTooltipPos((prev) => ({ ...prev, visible: !prev.visible }))
              : setTooltipPos({
                  x: dataPoint.x,
                  y: dataPoint.y,
                  value: dataPoint.value,
                  label: labels[dataPoint.index],
                  visible: true,
                });
          }}
          decorator={() =>
            tooltipPos.visible ? (
              <View
                style={{
                  position: 'absolute',
                  top: tooltipPos.y - 30,
                  left: tooltipPos.x - 40,
                  backgroundColor: '#007bff',
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  zIndex: 99,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13 }}>
                  {tooltipPos.label}: ₹{tooltipPos.value.toFixed(2)}
                </Text>
              </View>
            ) : null
          }
          style={{
            marginTop: 8,
            borderRadius: 16,
            alignSelf: 'center',
          }}
        />
      </ScrollView>
    </View>
  );
};

export default Graph;

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 6,
  },
  accentBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007bff',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007bff',
    textAlign: 'center',
  },
});
