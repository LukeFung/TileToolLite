import System.Collections.Generic;
import System.IO;

class UPaint extends EditorWindow
{
	static var window : EditorWindow;
	static var image : Texture2D;
	static var images : List.<Texture2D> = new List.<Texture2D>();
	static var palettes : List.<Color> = new List.<Color>();
	static var scrollPosition : Vector2 = Vector2.zero;
	static var editScrollPosition : Vector2 = Vector2.zero;
	static var selectedImage : int;
	static var currentColor : Color;
	static var resolution : int;
	static var splits : int;
	static var tool : String;
	static var zoom : float;
	static var pixel : Texture2D;
	static var showGrid : boolean;
	static var dragging : boolean;
	static var dragPos : Vector2;
	static var clipboard : Color[];
	
	@MenuItem("Window/UPaint")
	static function Init()
	{
		ShowWindow();
	}
	
	static function ShowWindow()
	{
		image = null;
		images = new List.<Texture2D>();
		pixel = Resources.Load("Pixel");
		showGrid = true;
		if(palettes.Count == 0)
		{
			palettes = new List.<Color>();
			if(!File.Exists("Assets/Upaint/Palettes/DefaultPalette.txt"))
			{
				for(var i = 0; i < 12; i++)palettes.Add(Color(Random.value, Random.value, Random.value, 1.0));
			}
			else
			{
				ImportPalettes("Assets/Upaint/Palettes/DefaultPalette.txt");
			}
		}
		currentColor = Color.black;
		currentColor.a = 255;
		selectedImage = 0;
		tool = "Pencil";
		window = GetWindow(UPaint);
		window.position = Rect(Screen.width/2, Screen.height/2, 0, 0);
		window.maxSize = Vector2(610, 454);
		window.minSize = window.maxSize;
		window.Show();
	}
	
	function OnGUI()
	{
		GUI.color = Color.black;
		GUI.Box(Rect(0, 0, 610, 454), "");
		
		GUI.color = Color.white;
		GUILayout.BeginArea(Rect(2, 2, 402, 24), "", "Box");
		GUILayout.BeginHorizontal();
		if(GUILayout.Button("New Tileset"))
		{
			var newTilesetWindow = EditorWindow.GetWindow(ImageSettings);
			newTilesetWindow.state = "NewTileset";
			newTilesetWindow.ShowWindow();
		}
		if(GUILayout.Button("Import Tileset"))
		{
			var importTilesetWindow = EditorWindow.GetWindow(ImageSettings);
			importTilesetWindow.state = "ImportTileset";
			importTilesetWindow.ShowWindow();
		}
		if(GUILayout.Button("Export Tileset") && images.Count > 0)
		{
			SaveSheet();
		}
		if(GUILayout.Button("Organize Tiles") && images.Count > 0)
		{
			var organizeTilesetWindow = EditorWindow.GetWindow(Organizer);
			organizeTilesetWindow.ShowWindow();
			organizeTilesetWindow.SetImages(images, splits);
		}
		GUILayout.EndHorizontal();
		GUILayout.EndArea();
		
		GUILayout.BeginArea(Rect(406, 2, 202, 24), "", "Box");
		GUILayout.BeginHorizontal();
		if(images.Count > 0)
		{
			if(GUILayout.Button("Import Tile"))
			{
				var importTileWindow = EditorWindow.GetWindow(ImageSettings);
				importTileWindow.state = "ImportTile";
				importTileWindow.pix = resolution/splits;
				importTileWindow.ShowWindow();
			}
			if(GUILayout.Button("Export Tile"))
			{
				SaveTile();
			}	
		}
		if(images.Count == 0)GUILayout.Label(":No tile in preview:");
		GUILayout.EndHorizontal();
		GUILayout.EndArea();
		
		GUILayout.BeginArea(Rect(2, 28, 96, 290), "", "Box");
		if(images.Count > 0)
		{
			DrawButtons();
		}
		GUILayout.EndArea();
		
		GUILayout.BeginArea(Rect(502, 28, 106, 290), "", "Box");
		GUILayout.BeginHorizontal();
		GUILayout.FlexibleSpace();
		if(GUILayout.Button("Load Palette"))
		{
			var palette = EditorUtility.OpenFilePanel("Import TXT Palette File", "Assets/Upaint/Palettes/", "txt");
			if(palette.Length != 0) ImportPalettes(palette);
		}
		GUILayout.FlexibleSpace();
		GUILayout.EndHorizontal();
		DrawPalettes();
		GUILayout.EndArea();
		
		GUILayout.BeginArea(Rect(502, 320, 106, 132), "", "Box");
		GUILayout.Label("Current Color");
		currentColor = EditorGUILayout.ColorField(currentColor);
		var previousBGColor : Color = GUI.backgroundColor;

		if(tool == "Pencil") GUI.backgroundColor = Color.green;
		if(GUILayout.Button("Pencil"))
		{
			tool = "Pencil";
			Repaint();
		}

		if(tool == "Color Picker") GUI.backgroundColor = Color.green;
		else if(GUI.backgroundColor == Color.green) GUI.backgroundColor = previousBGColor;
		if(GUILayout.Button("Color Picker"))
		{
			tool = "Color Picker";
			Repaint();
		}

		if(tool == "Area Fill") GUI.backgroundColor = Color.green;
		else if(GUI.backgroundColor == Color.green) GUI.backgroundColor = previousBGColor;
		if(GUILayout.Button("Area Fill"))
		{
			tool = "Area Fill";
			Repaint();
		}

		if(tool == "Color Swap") GUI.backgroundColor = Color.green;
		else if(GUI.backgroundColor == Color.green) GUI.backgroundColor = previousBGColor;
		if(GUILayout.Button("Color Swap"))
		{
			tool = "Color Swap";
			Repaint();
		}

		GUI.backgroundColor = previousBGColor;
		GUILayout.EndArea();
		
		GUILayout.BeginArea(Rect(2, 320, 96, 132), "", "Box");
		
		if(GUILayout.Button("Toggle Grid") && image)showGrid = !showGrid;
		
		GUILayout.BeginHorizontal();
		if(GUILayout.Button("L") && image) RotateLeft();
		GUILayout.FlexibleSpace();
		GUILayout.Label("Rotate");
		GUILayout.FlexibleSpace();
		if(GUILayout.Button("R") && image) RotateRight();
		GUILayout.EndHorizontal();
		
		GUILayout.BeginHorizontal();
		if(GUILayout.Button("H") && image) FlipHorizontal();
		GUILayout.FlexibleSpace();
		GUILayout.Label("Flip");
		GUILayout.FlexibleSpace();
		if(GUILayout.Button("V") && image) FlipVertical();
		GUILayout.EndHorizontal();
		
		
		GUILayout.BeginHorizontal();
		if(GUILayout.Button("-") && image)
		{
			if(zoom > 0)
			{
				zoom -= 100/(parseFloat(resolution)/parseFloat(splits));
			}
		}
		GUILayout.FlexibleSpace();
		GUILayout.Label("Zoom");
		GUILayout.FlexibleSpace();
		if(GUILayout.Button("+") && image)
		{
			if(zoom < 50)
			{
				zoom += 100/(parseFloat(resolution)/parseFloat(splits));
			}
		}
		GUILayout.EndHorizontal();
		
		if(GUILayout.Button("Copy Tile") && image) clipboard = images[selectedImage].GetPixels();
		if(GUILayout.Button("Paste Tile") && image)
		{
			Undo.RecordObject(images[selectedImage], "Paste Tile");
			images[selectedImage].SetPixels(clipboard);
			images[selectedImage].Apply();
			Repaint();
		}
		
		GUILayout.EndArea();
		GUI.BeginGroup(Rect(100, 28, 400, 400), "", "Box");
		if(image && images.Count > 0)
		{
			DrawTexture();
		}
		GUI.EndGroup();
		
		GUI.color = Color.white;
		GUILayout.BeginArea(Rect(100, 430, 400, 22), "", "Box");
		GUILayout.BeginHorizontal();
		if(image)
		{
			GUILayout.Label("Current Tool: " + tool);
			GUILayout.FlexibleSpace();
			GUILayout.Label("Preview: Image #" + selectedImage.ToString());
		}
		if(!image)GUILayout.Label(":No Image Selected:");
		GUILayout.EndHorizontal();
		GUILayout.EndArea();
	}
	
	function CreateNewSheet(r : int, s : int)
	{
		images.Clear();
		resolution = r;
		splits = s;
		image = new Texture2D(resolution/splits, resolution/splits);
		image.SetPixels(0, 0, resolution/splits, resolution/splits, FillCanvas(resolution/splits));
		image.Apply();
		images.Add(image);
		var size = (splits * splits) - 1;
		for(var a = 0; a < size; a++)
		{
			var i = new Texture2D(resolution/splits, resolution/splits);
			i.SetPixels(0, 0, resolution/splits, resolution/splits, FillCanvas(resolution/splits));
			i.Apply();
			images.Add(i);
		}
	}
	
	function ImportSheet(r : int, s : int, t : Texture2D)
	{
		images.Clear();
		resolution = r;
		splits = s;
		var path = AssetDatabase.GetAssetPath(t);
		var ti : TextureImporter = AssetImporter.GetAtPath(path);
		var p : Color[];
		var i : Texture2D;
		var a : int;
		var b : int;
		if(!ti.isReadable)
		{
			if(EditorUtility.DisplayDialog("Texture Not Readable", "The selected texture is not set to read/write. Would you like it to be set for you?", "Set", "Cancel"))
			{
				ti.isReadable = true;
				AssetDatabase.ImportAsset(path);
				for(a = 0; a < splits; a++)
				{
					for(b = 0; b < splits; b++)
					{
						p = t.GetPixels(a * (resolution/splits), b * (resolution/splits), resolution/splits, resolution/splits);
						i = new Texture2D(resolution/splits, resolution/splits);
						i.SetPixels(0, 0, resolution/splits, resolution/splits, p);
						i.Apply();
						if(a == 0 && b == 0)image = i;
						images.Add(i);
					}
				}
			}
		}
		else
		{
			for(a = 0; a < splits; a++)
			{
				for(b = 0; b < splits; b++)
				{
					p = t.GetPixels(a * (resolution/splits), b * (resolution/splits), resolution/splits, resolution/splits);
					i = new Texture2D(resolution/splits, resolution/splits);
					i.SetPixels(0, 0, resolution/splits, resolution/splits, p);
					i.Apply();
					if(a == 0 && b == 0)image = i;
					images.Add(i);
				}
			} 
		}
	}
	
	function ImportTile(t : Texture2D)
	{
		var path = AssetDatabase.GetAssetPath(t);
		var ti : TextureImporter = AssetImporter.GetAtPath(path);
		var p : Color[];
		var i : Texture2D;
		if(!ti.isReadable)
		{
			if(EditorUtility.DisplayDialog("Texture Not Readable", "The selected texture is not set to read/write. Would you like it to be set for you?", "Set", "Cancel"))
			{
				ti.isReadable = true;
				AssetDatabase.ImportAsset(path);

				Undo.RecordObject(images[selectedImage], "Import Tile");
				p = t.GetPixels(0, 0, t.width, t.height);
				images[selectedImage].SetPixels(0, 0, t.width, t.height, p);
				images[selectedImage].Apply();
				image = images[selectedImage];
			}
		}
		else
		{
			Undo.RecordObject(images[selectedImage], "Import Tile");
			p = t.GetPixels(0, 0, t.width, t.height);
			//i = new Texture2D(t.width, t.height);
			//i.SetPixels(0, 0, t.width, t.height, p);
			//i.Apply();
			images[selectedImage].SetPixels(0, 0, t.width, t.height, p);
			images[selectedImage].Apply();
			image = images[selectedImage];
		}
	}
	
	static function ImportPalettes(path : String)
	{
		palettes = new List.<Color>();
		var sr = new StreamReader(path);
		for(var i = 0; i < 12; i++)
		{
			var line = sr.ReadLine();
			var colors : String[] = new String[4];
			var curColor : int = 0;
			for(var a = 0; a < line.Length; a++)
			{
				if(line[a].ToString() != ",")
				{
					colors[curColor] += line[a].ToString();
					continue;
				}
				else
				{
					curColor += 1;
				}
			}
			palettes.Add(Color(parseFloat(colors[0]), parseFloat(colors[1]), parseFloat(colors[2]), parseFloat(colors[3])));
		}
		sr.Close();
	}
	
	function SaveTile()
	{
		var path = EditorUtility.SaveFilePanelInProject("Save Tile as PNG", "NewTile.png", "png", "Please enter a file name");
		if(path.Length != 0)
		{
			var bytes = images[selectedImage].EncodeToPNG();
			File.WriteAllBytes(path, bytes);
			AssetDatabase.Refresh();
			if(System.IO.File.Exists(path))
			{
				var ti : TextureImporter = AssetImporter.GetAtPath(path);
				ti.maxTextureSize = resolution;
				ti.isReadable = true;
				ti.mipmapEnabled = false;
				ti.linearTexture = true;
				ti.alphaIsTransparency = true;
				ti.wrapMode = TextureWrapMode.Clamp;
				ti.filterMode = FilterMode.Point;
				ti.textureFormat = TextureImporterFormat.AutomaticTruecolor;
				AssetDatabase.ImportAsset(path);
			}
		}
	}
	
	function SaveSheet()
	{
		var path = EditorUtility.SaveFilePanelInProject("Save Tileset as PNG", "NewTileset.png", "png", "Please enter a file name");
		if(path.Length != 0)
		{
			var sheet : Texture2D = new Texture2D(resolution, resolution);
			for(var a = 0; a < splits; a++)
			{
				for(var b = 0; b < splits; b++)
				{
					sheet.SetPixels(a * (resolution/splits), b * (resolution/splits), resolution/splits, resolution/splits, images[a * splits + b].GetPixels(0, 0, resolution/splits, resolution/splits));
				}
			}
			var bytes = sheet.EncodeToPNG();
			File.WriteAllBytes(path, bytes);
			AssetDatabase.Refresh();
			if(System.IO.File.Exists(path))
			{
				var ti : TextureImporter = AssetImporter.GetAtPath(path);
				ti.maxTextureSize = resolution;
				ti.isReadable = true;
				ti.mipmapEnabled = false;
				ti.linearTexture = true;
				ti.alphaIsTransparency = true;
				ti.wrapMode = TextureWrapMode.Clamp;
				ti.filterMode = FilterMode.Point;
				ti.textureFormat = TextureImporterFormat.AutomaticTruecolor;
				AssetDatabase.ImportAsset(path);
			}
		}
	}
	
	function SavePalettes(path : String)
	{
		var sw = new StreamWriter(path);
		for(var i = 0; i < 12; i++)
		{
			sw.WriteLine(palettes[i].r + "," + palettes[i].g + "," + palettes[i].b + "," + palettes[i].a);
		}
		sw.Close();
		AssetDatabase.Refresh();
	}
	
	function DrawTexture()
	{
		var size : float = 400/(resolution/splits) + zoom;
		editScrollPosition = GUI.BeginScrollView(Rect(0, 0, 400, 400), editScrollPosition, Rect(0, 0, 400 + (resolution/splits * zoom), 400 + (resolution/splits * zoom)));
		for(var a = 0; a < resolution/splits; a++)
		{
			for(var b = 0; b < resolution/splits; b++)
			{
				var pixelRect : Rect = Rect(a * size, (((resolution/splits) - 1) - b) * size, size, size);
				var thisPixel : Rect = Rect(a, b, 1, 1);
				GUI.color = images[selectedImage].GetPixel(thisPixel.x, thisPixel.y);
				GUI.DrawTexture(pixelRect, pixel, ScaleMode.ScaleToFit);
				if(pixelRect.Contains(Event.current.mousePosition))
				{
					if(Event.current.button == 1 && Event.current.type == EventType.MouseDrag || Event.current.button == 1 && Event.current.type == EventType.MouseDown)
					{
						var colorZero : Color = Color(0.0, 0.0, 0.0, 0.0);
						if(images[selectedImage].GetPixel(thisPixel.x, thisPixel.y) != colorZero)
						{
							Undo.RecordObject(images[selectedImage], "Erase Pixel");
							images[selectedImage].SetPixel(thisPixel.x, thisPixel.y, colorZero);
							images[selectedImage].Apply();
						}
						Repaint();
					}
					if(Event.current.button == 0 && Event.current.type == EventType.MouseDrag || Event.current.button == 0 && Event.current.type == EventType.MouseDown)
					{
						if(images[selectedImage].GetPixel(thisPixel.x, thisPixel.y) != currentColor)
						{
							if(tool == "Pencil")
							{
								Undo.RecordObject(images[selectedImage], "Use Pencil");
								images[selectedImage].SetPixel(thisPixel.x, thisPixel.y, currentColor);
								images[selectedImage].Apply();
							}
							if(tool == "Color Swap")
							{
								Undo.RecordObject(images[selectedImage], "Use Color Swap");
								SwapColor(images[selectedImage].GetPixel(thisPixel.x, thisPixel.y));
							}
							if(tool == "Color Picker")
							{
								Undo.RecordObject(images[selectedImage], "Use Color Picker");
								currentColor = images[selectedImage].GetPixel(thisPixel.x, thisPixel.y);
								tool = "Pencil";
							}
							if(tool == "Area Fill")
							{
								Undo.RecordObject(images[selectedImage], "Use Area Fill");
								Flood(Vector2(a, b), images[selectedImage].GetPixel(thisPixel.x, thisPixel.y));
								images[selectedImage].Apply();
							}
						}
						Repaint();
					}
				}
			}
			Repaint();
		}
		if(showGrid)DrawGrid();
		Repaint();
		GUI.EndScrollView();
	}
	
	function DrawGrid()
	{
		var size : float = 400/(resolution/splits) + zoom;
		for(var a = 0; a < resolution/splits; a++)
		{
			GUI.color = Color.black;
			GUI.DrawTexture(Rect(0, a * size, resolution/splits * size, 1), pixel, ScaleMode.StretchToFill);
			GUI.DrawTexture(Rect(a * size, 0, 1, resolution/splits * size), pixel, ScaleMode.StretchToFill);
		}
	}
	
	function FillCanvas(size : int)
	{
		var colors : Color[] = new Color[size * size];
		for(var a = 0; a < size * size; a++)
		{
			colors[a].a = 0;
		}
		return colors;
	}
	
	function FlipVertical()
	{
		Undo.RecordObject(images[selectedImage], "Vertical Flip");
		var colors : Color[] = images[selectedImage].GetPixels(0, 0, images[selectedImage].width, images[selectedImage].height);
		for(var a = 0; a < images[selectedImage].width; a++)
		{
			for(var b = 0; b < images[selectedImage].height; b++)
			{
				images[selectedImage].SetPixel(b, a, colors[a * images[selectedImage].width + (images[selectedImage].width - (b + 1))]);
			}
		}
		images[selectedImage].Apply();
	}
	
	function FlipHorizontal()
	{
		Undo.RecordObject(images[selectedImage], "Horizontal Flip");
		var colors : Color[] = images[selectedImage].GetPixels(0, 0, images[selectedImage].width, images[selectedImage].height);
		for(var a = 0; a < images[selectedImage].width; a++)
		{
			for(var b = 0; b < images[selectedImage].height; b++)
			{
				images[selectedImage].SetPixel(b, a, colors[((images[selectedImage].width * images[selectedImage].width) - 1) - (a * images[selectedImage].width + (images[selectedImage].width - (b + 1)))]);
			}
		}
		images[selectedImage].Apply();
	}
	
	function RotateLeft()
	{
		Undo.RecordObject(images[selectedImage], "Rotate Left");
		var colors : Color[] = images[selectedImage].GetPixels(0, 0, images[selectedImage].width, images[selectedImage].height);
		for(var a = 0; a < images[selectedImage].width; a++)
		{
			for(var b = 0; b < images[selectedImage].height; b++)
			{
				images[selectedImage].SetPixel((images[selectedImage].height - 1) - a, b, colors[a * images[selectedImage].width + b]);
			}
		}
		images[selectedImage].Apply();
	}
	
	function RotateRight()
	{
		Undo.RecordObject(images[selectedImage], "RotateRight");
		var colors : Color[] = images[selectedImage].GetPixels(0, 0, images[selectedImage].width, images[selectedImage].height);
		for(var a = 0; a < images[selectedImage].width; a++)
		{
			for(var b = 0; b < images[selectedImage].height; b++)
			{
				images[selectedImage].SetPixel(a, (images[selectedImage].height - 1) - b, colors[a * images[selectedImage].width + b]);
			}
		}
		images[selectedImage].Apply();
	}
	
	function Flood(Pos : Vector2, targetColor : Color)
	{
		if(Pos.x < 0 || Pos.x > images[selectedImage].width - 1 || Pos.y < 0 || Pos.y > images[selectedImage].height - 1) return;
		if(images[selectedImage].GetPixel(Pos.x, Pos.y) != targetColor) return;
		if(targetColor == currentColor) return;
		images[selectedImage].SetPixel(Pos.x, Pos.y, currentColor);
		Flood(Vector2(Pos.x - 1, Pos.y), targetColor);
		Flood(Vector2(Pos.x, Pos.y + 1), targetColor);
		Flood(Vector2(Pos.x + 1, Pos.y), targetColor);
		Flood(Vector2(Pos.x, Pos.y - 1), targetColor);
	}
	
	function SwapColor(c : Color)
	{
		for(var a = 0; a < images[selectedImage].width; a++)
		{
			for(var b = 0; b < images[selectedImage].height; b++)
			{
				if(images[selectedImage].GetPixel(a, b) == c)
				{
					images[selectedImage].SetPixel(a, b, currentColor);
				}
			}
		}
		images[selectedImage].Apply();
	}
	
	function DrawButtons()
	{
		scrollPosition = GUILayout.BeginScrollView(scrollPosition, false, true, GUILayout.Width(92), GUILayout.Height(286));
		var previousBGColor : Color = GUI.backgroundColor;
		for(var a = 0; a < splits * splits; a++)
		{
			if(GUI.backgroundColor == Color.green) GUI.backgroundColor = previousBGColor;
			if(selectedImage == a) GUI.backgroundColor = Color.green;
			if(GUILayout.Button(GUIContent("#" + a.ToString(), images[a]), GUILayout.Width(70), GUILayout.Height(20)))
			{
				Undo.RecordObject(this, "ChangeTile");
				selectedImage = a;
				zoom = 0;
				Repaint();
			}
		}
		GUI.backgroundColor = previousBGColor;
		GUILayout.EndScrollView();
	}
	
	function DrawPalettes()
	{
		for(var a = 0; a < palettes.Count; a++)
		{
			GUILayout.BeginHorizontal();
			if(GUILayout.Button("Use"))currentColor = palettes[a];
			palettes[a] = EditorGUILayout.ColorField(palettes[a]);
			GUILayout.EndHorizontal();
		}
		if(GUILayout.Button("Save Palettes"))
		{
			var path = EditorUtility.SaveFilePanel("Save Palette As TXT", "Assets/Upaint/Palettes/", "New_Palette.txt", "txt");
			if(path.Length != 0) SavePalettes(path);
		}
	}
}