import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Display, T } from "@/src/ui/type";
import { Screen } from "@/src/ui/layout";
import { supabase } from "@/src/lib/supabase";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { FormControl, FormControlError, FormControlErrorText } from "@/components/ui/form-control";

/**
 * The door.
 *
 * Chrome, so it is gluestack: Input, Button and FormControl bring the keyboard handling, focus
 * behaviour and screen-reader wiring that hand-rolled React Native fields quietly skip.
 */
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err.message);
    setBusy(false);
  };

  return (
    <Screen edges={["top", "bottom"]}>
      {/* Anchored below the top rather than floated dead-centre: on a phone, centring a short form
          in a tall screen leaves a void above it and drops the fields under the thumb line. */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-[26px] pt-[96px]">
        <Display size={34} style={{ maxWidth: 280 }}>Family Investing Club</Display>
        <T size={15} className="mt-[10px]">Learn it together, then decide together.</T>

        <FormControl isInvalid={!!error} className="mt-[36px]">
          <Input>
            <InputField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />
          </Input>
          <Input className="mt-[12px]">
            <InputField
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              onSubmitEditing={submit}
            />
          </Input>
          <FormControlError>
            <FormControlErrorText>{error}</FormControlErrorText>
          </FormControlError>
        </FormControl>

        <Button size="lg" className="mt-[20px]" isDisabled={busy || !email || !password} onPress={submit}>
          <ButtonText>{busy ? "Signing in…" : "Sign in"}</ButtonText>
        </Button>
      </KeyboardAvoidingView>
    </Screen>
  );
}
