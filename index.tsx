import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  ColorValue,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

const DEFAULT_FOCUS_BORDER_COLOR = '#000000';
const DEFAULT_OFF_FOCUS_BORDER_COLOR = '#DCDCDC';

/**
 * this class for input
 */
export class OTPMaskingChar {
  private _val: string;
  constructor(val: string) {
    if (val.length !== 1) {
      throw new Error('maskingChar is allowed to have only 1 charecter');
    } else {
      this._val = val;
    }
  }
  public get value(): string {
    return this._val;
  }
}

export type OtpInputProps = Omit<
  {
    value?: string;
    inputCount: number;
    containerStyle?: StyleProp<ViewStyle>;
    inputCellLength?: number;
    tintColor?: ColorValue;
    offTintColor?: ColorValue;
    handleTextChange?: (value: any) => any;
    testIDPrefix?: string;
    maskingChar?: OTPMaskingChar;
    autoFocus?: boolean;
  } & TextInputProps,
  'defaultValue'
>;

export type OtpInputRef = {
  focus: () => void;
};

const getOTPTextChucks = (
  inputCount: number,
  inputCellLength: number,
  text: string,
) => {
  // dividing the text into cell text array
  const slicedArray =
    text.match(new RegExp('.{1,' + inputCellLength + '}', 'g')) || [];

  // returning the exact size of array as inputCount indicates
  return slicedArray.slice(0, inputCount);
};

const repaceOtp = (
  prevOtp: string,
  newOtp: string,
  maskedChar: string | undefined,
): string => {
  let updatedOtp = '';
  if (!maskedChar) {
    updatedOtp = newOtp;
  } else {
    for (let i = 0; i < newOtp.length; i++) {
      updatedOtp =
        updatedOtp + (newOtp[i] !== maskedChar ? newOtp[i] : prevOtp[i]);
    }
  }
  return updatedOtp;
};

const OtpTextInput = forwardRef<OtpInputRef, OtpInputProps>(function (
  {
    inputCount,
    offTintColor,
    tintColor,
    value,
    inputCellLength,
    containerStyle,
    keyboardType,
    testIDPrefix,
    handleTextChange,
    maskingChar,
    style,
    autoFocus,
    ...textInputProps
  },
  ref,
) {
  inputCellLength = inputCellLength || 1;
  const initialOtpTextArray = getOTPTextChucks(
    inputCount,
    inputCellLength,
    value || '',
  );
  const [otpTextArray, setOtpTextArray] =
    useState<string[]>(initialOtpTextArray);
  const [focusedInputIndex, setfocusedInputIndex] = useState<number>(
    autoFocus || autoFocus === undefined
      ? initialOtpTextArray.length < inputCount
        ? initialOtpTextArray.length
        : inputCount - 1
      : -1,
  );
  const inputs: TextInput[] = [];

  useImperativeHandle<OtpInputRef, OtpInputRef>(
    ref,
    () => ({
      focus: () => inputs[focusedInputIndex].focus(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedInputIndex],
  );

  useEffect(() => {
    const newOtpTextArray = getOTPTextChucks(
      inputCount,
      inputCellLength || 1,
      value || '',
    );
    setOtpTextArray(newOtpTextArray);

    const newFocusdInputIndex =
      newOtpTextArray.length === inputCount
        ? inputCount - 1
        : newOtpTextArray.length === 0
        ? 0
        : newOtpTextArray[newOtpTextArray.length - 1].length === inputCellLength
        ? newOtpTextArray.length
        : newOtpTextArray.length - 1;

    setfocusedInputIndex(newFocusdInputIndex);
    inputs[newFocusdInputIndex].focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onTextChange = (text: string, i: number) => {
    otpTextArray[i] = repaceOtp(otpTextArray[i], text, maskingChar?.value);
    const otp = otpTextArray.join('');

    if (handleTextChange) {
      handleTextChange(otp.slice(0, (inputCellLength || 1) * inputCount));
    } else {
      const otpArray = getOTPTextChucks(
        inputCount,
        inputCellLength || 1,
        otp || '',
      );
      setOtpTextArray(otpArray);
      fixFocus(otpArray);
    }
  };

  const onInputFocus = (i: number) => {
    if (i !== focusedInputIndex) {
      setfocusedInputIndex(i);
    }
  };

  const onKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    i: number,
  ) => {
    const val = otpTextArray[i] || '';

    if (e.nativeEvent.key === 'Backspace' && i !== 0 && !val.length) {
      if (otpTextArray[i - 1]) {
        otpTextArray[i - 1] = otpTextArray[i - 1]
          .split('')
          .splice(0, otpTextArray[i - 1].length - 1)
          .join('');

        if (handleTextChange) {
          handleTextChange(otpTextArray.join(''));
        } else {
          setOtpTextArray([...otpTextArray]);
          fixFocus(otpTextArray);
        }
      } else {
        setfocusedInputIndex(
          otpTextArray.length > 0 ? otpTextArray.length - 1 : 0,
        );
        inputs[otpTextArray.length > 0 ? otpTextArray.length - 1 : 0].focus();
      }
    }
  };

  const fixFocus = (otpArray: string[]) => {
    const newFocusdInputIndex =
      otpArray.length === inputCount
        ? inputCount - 1
        : otpArray.length === 0
        ? 0
        : otpArray[otpArray.length - 1].length === inputCellLength
        ? otpArray.length
        : otpArray.length - 1;

    setfocusedInputIndex(newFocusdInputIndex);
    inputs[newFocusdInputIndex].focus();
  };

  console.log(
    `>>>this is in otpTxtInput: value- ${value}, otparray- ${otpTextArray}<<<<`,
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {Array.apply(null, Array(inputCount)).map((val, i) => (
        <TextInput
          ref={e => {
            if (e) {
              inputs[i] = e;
            }
          }}
          key={i}
          maxLength={inputCount - 1 === i ? inputCellLength : undefined}
          autoCorrect={false}
          keyboardType={keyboardType}
          autoFocus={i === focusedInputIndex}
          value={
            otpTextArray[i]
              ? maskingChar?.value.repeat(otpTextArray[i].length) ||
                otpTextArray[i]
              : ''
          }
          style={[
            styles.textInput,
            style,
            {
              borderColor:
                focusedInputIndex === i
                  ? tintColor || DEFAULT_FOCUS_BORDER_COLOR
                  : offTintColor || DEFAULT_OFF_FOCUS_BORDER_COLOR,
            },
          ]}
          onFocus={() => onInputFocus(i)}
          onChangeText={text => onTextChange(text, i)}
          multiline={false}
          onKeyPress={e => onKeyPress(e, i)}
          {...textInputProps}
          testID={`${testIDPrefix}${i}`}
        />
      ))}
    </View>
  );
});

export default OtpTextInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInput: {
    height: 50,
    width: 50,
    borderBottomWidth: 4,
    margin: 5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '500',
  },
});
